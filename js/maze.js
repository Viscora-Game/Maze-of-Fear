export function generateMaze(width, height, numFloors = 1) {
  // Ensure odd dimensions for tile-based carving
  if (width % 2 === 0) width += 1;
  if (height % 2 === 0) height += 1;

  const floors = [];

  // 1. Initialize floors of solid walls
  for (let f = 0; f < numFloors; f++) {
    const grid = [];
    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        row.push({
          x,
          y,
          floor: f,
          type: "wall",       // "wall" or "floor"
          staircase: null,    // null, "up", "down"
          obstacle: null,     // { type, resolved }
          chest: null,        // { id, opened, content: { type, value, item, amount, damage } }
          npc: null,          // { id, name, spokenTo }
          puzzleClue: null,   // string e.g. "4135"
          isExit: false,
          isEntrance: false,
          region: -1
        });
      }
      grid.push(row);
    }
    floors.push(grid);
  }

  const getCell = (f, x, y) => {
    if (f >= 0 && f < numFloors && x >= 0 && x < width && y >= 0 && y < height) {
      return floors[f][y][x];
    }
    return null;
  };

  // 2. DFS Maze Carver on a single floor grid
  const carveSingleFloor = (f) => {
    const grid = floors[f];
    const stack = [];
    let current = { x: 1, y: 1 };
    
    grid[1][1].type = "floor";
    const visited = new Set();
    visited.add("1,1");

    while (true) {
      const neighbors = [];
      const dirs = [[0, -2], [0, 2], [-2, 0], [2, 0]];
      for (const [dx, dy] of dirs) {
        const nx = current.x + dx;
        const ny = current.y + dy;
        if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1) {
          if (!visited.has(`${nx},${ny}`)) {
            neighbors.push({ x: nx, y: ny });
          }
        }
      }

      if (neighbors.length > 0) {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        
        // Carve wall in between current and next
        const cx = current.x + (next.x - current.x) / 2;
        const cy = current.y + (next.y - current.y) / 2;
        grid[cy][cx].type = "floor";
        grid[next.y][next.x].type = "floor";
        
        visited.add(`${next.x},${next.y}`);
        stack.push(current);
        current = next;
      } else if (stack.length > 0) {
        current = stack.pop();
      } else {
        break;
      }
    }
  };

  // Carve mazes for all floors
  for (let f = 0; f < numFloors; f++) {
    carveSingleFloor(f);
  }

  // 3. Connect Floors using Staircases at random odd room coordinates
  // Collect all odd room coordinates
  const oddRooms = [];
  for (let y = 1; y < height - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      oddRooms.push({ x, y });
    }
  }

  // Shuffle rooms for random distributions
  const shuffleArray = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  };
  
  shuffleArray(oddRooms);

  // Link Floor f to Floor f+1
  for (let f = 0; f < numFloors - 1; f++) {
    // Pick a unique odd room for this connection
    const r = oddRooms[f % oddRooms.length];
    
    // Set staircase down on floor f
    floors[f][r.y][r.x].staircase = "down";
    // Set staircase up on floor f+1
    floors[f+1][r.y][r.x].staircase = "up";
  }

  // 4. Find Critical Path on the 3D Graph (X, Y, Floor)
  const queue = [{ x: 1, y: 1, floor: 0 }];
  const distMap = new Map();
  distMap.set("1,1,0", 0);
  const parentMap = new Map();

  let deepestNode = { x: 1, y: 1, floor: 0 };
  let maxDistance = 0;

  const visited3D = new Set();
  visited3D.add("1,1,0");

  while (queue.length > 0) {
    const curr = queue.shift();
    const currKey = `${curr.x},${curr.y},${curr.floor}`;
    const currDist = distMap.get(currKey);

    if (currDist > maxDistance) {
      maxDistance = currDist;
      deepestNode = curr;
    }

    const neighbors = [];
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    
    // 1. Move orthogonally on same floor
    for (const [dx, dy] of dirs) {
      const nx = curr.x + dx;
      const ny = curr.y + dy;
      const nextCell = getCell(curr.floor, nx, ny);
      if (nextCell && nextCell.type === "floor") {
        neighbors.push({ x: nx, y: ny, floor: curr.floor });
      }
    }

    // 2. Move between staircases
    const cell = floors[curr.floor][curr.y][curr.x];
    if (cell.staircase === "down" && curr.floor < numFloors - 1) {
      neighbors.push({ x: curr.x, y: curr.y, floor: curr.floor + 1 });
    }
    if (cell.staircase === "up" && curr.floor > 0) {
      neighbors.push({ x: curr.x, y: curr.y, floor: curr.floor - 1 });
    }

    for (const n of neighbors) {
      const nKey = `${n.x},${n.y},${n.floor}`;
      if (!visited3D.has(nKey)) {
        visited3D.add(nKey);
        distMap.set(nKey, currDist + 1);
        parentMap.set(nKey, curr);
        queue.push(n);
      }
    }
  }

  // Force exit to be at the furthest bottom-right corner of the deepest floor
  const exitX = width - 2;
  const exitY = height - 2;
  const exitFloor = numFloors - 1;
  deepestNode = { x: exitX, y: exitY, floor: exitFloor };

  // Reconstruct Critical Path
  const critPath = [];
  let p = deepestNode;
  while (p) {
    critPath.push(p);
    p = parentMap.get(`${p.x},${p.y},${p.floor}`);
  }
  critPath.reverse();

  // Mark Entrance and Exit
  floors[0][1][1].isEntrance = true;
  floors[deepestNode.floor][deepestNode.y][deepestNode.x].isExit = true;

  // 5. Place Gates / Obstacles along the 3D Critical Path
  const pathLen = critPath.length;
  const b1Index = Math.floor(pathLen * 0.25);
  const b2Index = Math.floor(pathLen * 0.50);
  const b3Index = Math.floor(pathLen * 0.75);

  const barrierNodes = {
    b1: critPath[b1Index],
    b2: critPath[b2Index],
    b3: critPath[b3Index]
  };

  // Configure checkpoint obstacles (ensuring they block paths)
  floors[barrierNodes.b1.floor][barrierNodes.b1.y][barrierNodes.b1.x].obstacle = { type: "gate", resolved: false };
  floors[barrierNodes.b2.floor][barrierNodes.b2.y][barrierNodes.b2.x].obstacle = { type: "ivy", resolved: false };
  
  const doorCode = Math.floor(1000 + Math.random() * 9000).toString();
  floors[barrierNodes.b3.floor][barrierNodes.b3.y][barrierNodes.b3.x].obstacle = { type: "codeLock", code: doorCode, resolved: false };

  // 6. Partition the entire 3D maze into Regions 0, 1, 2, 3
  const assignRegions = () => {
    const markRegion = (startX, startY, startFloor, regionNum, blockers) => {
      const q = [{ x: startX, y: startY, floor: startFloor }];
      floors[startFloor][startY][startX].region = regionNum;
      
      const visited = new Set();
      visited.add(`${startX},${startY},${startFloor}`);

      while (q.length > 0) {
        const curr = q.shift();
        floors[curr.floor][curr.y][curr.x].region = regionNum;

        const neighbors = [];
        const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        
        for (const [dx, dy] of dirs) {
          const nx = curr.x + dx;
          const ny = curr.y + dy;
          const nextCell = getCell(curr.floor, nx, ny);
          if (nextCell && nextCell.type === "floor") {
            neighbors.push({ x: nx, y: ny, floor: curr.floor });
          }
        }

        const cell = floors[curr.floor][curr.y][curr.x];
        if (cell.staircase === "down" && curr.floor < numFloors - 1) {
          neighbors.push({ x: curr.x, y: curr.y, floor: curr.floor + 1 });
        }
        if (cell.staircase === "up" && curr.floor > 0) {
          neighbors.push({ x: curr.x, y: curr.y, floor: curr.floor - 1 });
        }

        for (const n of neighbors) {
          const nKey = `${n.x},${n.y},${n.floor}`;
          const nCell = floors[n.floor][n.y][n.x];
          
          if (!visited.has(nKey) && nCell.region === -1) {
            // Check blockers
            const isBlocker = blockers.some(b => b.x === n.x && b.y === n.y && b.floor === n.floor);
            if (!isBlocker) {
              visited.add(nKey);
              q.push(n);
            }
          }
        }
      }
    };

    // Region 0: Start at (1,1,0), B1 is blocker
    markRegion(1, 1, 0, 0, [barrierNodes.b1]);

    // Region 1: Start at B1, B2 is blocker
    markRegion(barrierNodes.b1.x, barrierNodes.b1.y, barrierNodes.b1.floor, 1, [barrierNodes.b2]);

    // Region 2: Start at B2, B3 is blocker
    markRegion(barrierNodes.b2.x, barrierNodes.b2.y, barrierNodes.b2.floor, 2, [barrierNodes.b3]);

    // Region 3: Start at B3, no blockers
    markRegion(barrierNodes.b3.x, barrierNodes.b3.y, barrierNodes.b3.floor, 3, []);

    // Cleanup unassigned floor tiles
    for (let f = 0; f < numFloors; f++) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const c = floors[f][y][x];
          if (c.type === "floor" && c.region === -1) {
            // Inherit from nearby floors/cells
            const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
            for (const [dx, dy] of dirs) {
              const n = getCell(f, x + dx, y + dy);
              if (n && n.region !== -1) {
                c.region = n.region;
                break;
              }
            }
            if (c.region === -1) c.region = 0;
          }
        }
      }
    }
  };

  assignRegions();

  // 7. Carve Loops within the same regions ONLY (retains locks as absolute bottlenecks)
  for (let f = 0; f < numFloors; f++) {
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const cell = floors[f][y][x];
        if (cell.type === "wall") {
          // Check if we can carve this wall to connect two floors of the same region
          // horizontal check
          const left = getCell(f, x - 1, y);
          const right = getCell(f, x + 1, y);
          if (left && right && left.type === "floor" && right.type === "floor") {
            if (left.region === right.region && Math.random() < 0.18) {
              cell.type = "floor";
              cell.region = left.region;
            }
          }
          // vertical check
          const top = getCell(f, x, y - 1);
          const bottom = getCell(f, x, y + 1);
          if (top && bottom && top.type === "floor" && bottom.type === "floor") {
            if (top.region === bottom.region && Math.random() < 0.18) {
              cell.type = "floor";
              cell.region = top.region;
            }
          }
        }
      }
    }
  }

  // 8. Place Items and Quest Actors
  const getFreeCellsInRegion = (rNum) => {
    const list = [];
    for (let f = 0; f < numFloors; f++) {
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const c = floors[f][y][x];
          if (c.type === "floor" && 
              c.region === rNum && 
              !c.isEntrance && 
              !c.isExit && 
              !c.obstacle && 
              !c.chest && 
              !c.npc && 
              !c.staircase && 
              !c.puzzleClue) {
            list.push(c);
          }
        }
      }
    }
    return list;
  };

  const getDeadEndsInRegion = (rNum) => {
    return getFreeCellsInRegion(rNum).filter(c => {
      let wallsCount = 0;
      const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
      for (const [dx, dy] of dirs) {
        const n = getCell(c.floor, c.x + dx, c.y + dy);
        if (!n || n.type === "wall") wallsCount++;
      }
      return wallsCount === 3;
    });
  };

  const placeItemInRegion = (rNum, itemConfig, avoidPositions = [], minDistance = 10) => {
    let list = getDeadEndsInRegion(rNum);
    if (list.length === 0) list = getFreeCellsInRegion(rNum);

    // Keep cells that are at least minDistance away from all avoid positions
    let filteredList = list.filter(c => {
      return avoidPositions.every(pos => {
        if (pos.floor !== c.floor) return true;
        const dist = Math.abs(pos.x - c.x) + Math.abs(pos.y - c.y);
        return dist >= minDistance;
      });
    });

    if (filteredList.length === 0) filteredList = list; // fallback

    if (filteredList.length > 0) {
      const cell = filteredList[Math.floor(Math.random() * filteredList.length)];
      cell.chest = itemConfig;
      return cell;
    }
    return null;
  };

  // Region 0 setup
  const avoidListReg0 = [{ x: 1, y: 1, floor: 0 }]; // start location

  const reg0Free = getFreeCellsInRegion(0);
  let wellCell = null;
  if (reg0Free.length > 0) {
    // Pick a well cell far from start (distance >= 12)
    let filtered = reg0Free.filter(c => Math.abs(c.x - 1) + Math.abs(c.y - 1) >= 12);
    if (filtered.length === 0) filtered = reg0Free;
    wellCell = filtered[Math.floor(Math.random() * filtered.length)];
    wellCell.npc = { id: "well", name: "Deep Well", spokenTo: false };
    avoidListReg0.push({ x: wellCell.x, y: wellCell.y, floor: wellCell.floor });
  }

  // Place Bucket far from Well and Start
  const bucketCell = placeItemInRegion(0, { id: "chest_bucket", opened: false, content: { type: "item", item: "bucket", gold: 10 } }, avoidListReg0, 15);
  if (bucketCell) avoidListReg0.push({ x: bucketCell.x, y: bucketCell.y, floor: bucketCell.floor });

  // Place Key far from Well, Start, and Bucket
  placeItemInRegion(0, { id: "chest_key", opened: false, content: { type: "item", item: "key", gold: 5 } }, avoidListReg0, 12);

  // Region 1 setup
  const avoidListReg1 = [{ x: barrierNodes.b1.x, y: barrierNodes.b1.y, floor: barrierNodes.b1.floor }]; // barrier entrance

  const reg1Free = getFreeCellsInRegion(1);
  let childCell = null;
  if (reg1Free.length > 0) {
    // Pick Lost Child location far from Region 1 entrance (distance >= 15)
    let filtered = reg1Free.filter(c => Math.abs(c.x - barrierNodes.b1.x) + Math.abs(c.y - barrierNodes.b1.y) >= 15);
    if (filtered.length === 0) filtered = reg1Free;
    childCell = filtered[Math.floor(Math.random() * filtered.length)];
    childCell.npc = { id: "child", name: "Lost Child", spokenTo: false };
    avoidListReg1.push({ x: childCell.x, y: childCell.y, floor: childCell.floor });
  }

  // Place Shears far from Child and Region 1 entrance
  const shearsCell = placeItemInRegion(1, { id: "chest_shears", opened: false, content: { type: "item", item: "shears", gold: 5 } }, avoidListReg1, 15);
  if (shearsCell) avoidListReg1.push({ x: shearsCell.x, y: shearsCell.y, floor: shearsCell.floor });

  // Place Cheese far from Child, entrance, and Shears
  const cheeseCell = placeItemInRegion(1, { id: "chest_cheese", opened: false, content: { type: "item", item: "cheese", gold: 5 } }, avoidListReg1, 12);
  if (cheeseCell) avoidListReg1.push({ x: cheeseCell.x, y: cheeseCell.y, floor: cheeseCell.floor });

  // Place Mouse far from other Region 1 elements
  const reg1NpcFree = getFreeCellsInRegion(1);
  if (reg1NpcFree.length > 0) {
    let filtered = reg1NpcFree.filter(c => {
      return avoidListReg1.every(pos => Math.abs(pos.x - c.x) + Math.abs(pos.y - c.y) >= 12);
    });
    if (filtered.length === 0) filtered = reg1NpcFree;
    const mouseCell = filtered[Math.floor(Math.random() * filtered.length)];
    mouseCell.npc = { id: "mouse", name: "Talking Mouse", spokenTo: false };
  }

  // Region 2 setup
  const avoidListReg2 = [{ x: barrierNodes.b2.x, y: barrierNodes.b2.y, floor: barrierNodes.b2.floor }]; // Region 2 entrance

  // Placement of Code Lock Clue in Region 2 far from entrance (B2) AND far from the actual code lock gate (B3) to prevent spawning next to it!
  const reg2Free = getFreeCellsInRegion(2);
  let clueCell = null;
  if (reg2Free.length > 0) {
    let filtered = reg2Free.filter(c => {
      const distToB2 = Math.abs(c.x - barrierNodes.b2.x) + Math.abs(c.y - barrierNodes.b2.y);
      const distToB3 = Math.abs(c.x - barrierNodes.b3.x) + Math.abs(c.y - barrierNodes.b3.y);
      return distToB3 >= 12 && distToB2 >= 10;
    });
    // Fallback if region size is very restricted
    if (filtered.length === 0) {
      filtered = reg2Free.filter(c => Math.abs(c.x - barrierNodes.b3.x) + Math.abs(c.y - barrierNodes.b3.y) >= 8);
    }
    if (filtered.length === 0) filtered = reg2Free;
    clueCell = filtered[Math.floor(Math.random() * filtered.length)];
    clueCell.puzzleClue = doorCode;
    avoidListReg2.push({ x: clueCell.x, y: clueCell.y, floor: clueCell.floor });
  }

  // Place Merchant far from entrance and Code Lock Clue
  const reg2NpcFree = getFreeCellsInRegion(2);
  if (reg2NpcFree.length > 0) {
    let filtered = reg2NpcFree.filter(c => {
      return avoidListReg2.every(pos => Math.abs(pos.x - c.x) + Math.abs(pos.y - c.y) >= 12);
    });
    if (filtered.length === 0) filtered = reg2NpcFree;
    const merchantCell = filtered[Math.floor(Math.random() * filtered.length)];
    merchantCell.npc = { id: "merchant", name: "Lost Merchant", spokenTo: false };
  }

  // Traveler in Region 0 or 1
  const travelerRegion = Math.random() < 0.5 ? 0 : 1;
  const travelerFree = getFreeCellsInRegion(travelerRegion);
  if (travelerFree.length > 0) {
    const travelerCell = travelerFree[Math.floor(Math.random() * travelerFree.length)];
    travelerCell.npc = { id: "traveler", name: "Old Traveler", spokenTo: false };
  }

  // Scatter Standard Chests & Optional Roadblocks (Barricades & Chasms)
  const regions = [0, 1, 2, 3];
  regions.forEach(rNum => {
    const deadEnds = getDeadEndsInRegion(rNum);
    deadEnds.forEach((c, idx) => {
      const roll = Math.random();
      let chestContent = {};
      if (roll < 0.50) {
        const rewardRoll = Math.random();
        if (rewardRoll < 0.3) {
          chestContent = { type: "gold", amount: 15 + Math.floor(Math.random() * 20) };
        } else if (rewardRoll < 0.6) {
          const items = ["fuel", "map_piece"];
          chestContent = { type: "item", item: items[Math.floor(Math.random() * items.length)], gold: 10 };
        } else {
          chestContent = { type: "gold", amount: 10 };
        }
      } else if (roll < 0.80) {
        chestContent = { type: "trap", damage: 15 + Math.floor(Math.random() * 10) };
      } else {
        chestContent = { type: "mimic", damage: 20 + Math.floor(Math.random() * 10) };
      }

      c.chest = {
        id: `chest_f${c.floor}_r${rNum}_${idx}`,
        opened: false,
        content: chestContent
      };
    });

    // Add optional roadblock to protect high-value chests
    const freeCells = getFreeCellsInRegion(rNum);
    if (freeCells.length > 3) {
      const targetDeadEnd = getDeadEndsInRegion(rNum).find(c => c.chest && c.chest.content.type === "gold");
      if (targetDeadEnd) {
        const obType = Math.random() < 0.5 ? "barricade" : "chasm";
        targetDeadEnd.obstacle = { type: obType, resolved: false };
        targetDeadEnd.chest.content = { type: "gold", amount: 45 + Math.floor(Math.random() * 35) };
        const items = ["fuel", "map_piece"];
        targetDeadEnd.chest.content.item = items[Math.floor(Math.random() * items.length)];
      }
    }
  });

  return {
    floors,
    width,
    height,
    numFloors,
    startCell: floors[0][1][1],
    exitCell: floors[deepestNode.floor][deepestNode.y][deepestNode.x],
    doorCode
  };
}
