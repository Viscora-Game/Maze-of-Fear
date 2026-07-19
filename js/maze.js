export function generateMaze(width, height, numFloors = 1, rng = globalThis.Math.random) {
  const Math = Object.create(globalThis.Math);
  Math.random = rng;

  const occupiedCells = [{ x: 1, y: 1, floor: 0 }]; // Track occupied positions (start is occupied)

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
       // Exclude entrance (1, 1) and exit (width - 2, height - 2) to prevent staircases spawning on them
       if ((x === 1 && y === 1) || (x === width - 2 && y === height - 2)) {
         continue;
       }
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
    occupiedCells.push({ x: r.x, y: r.y, floor: f });
    occupiedCells.push({ x: r.x, y: r.y, floor: f + 1 });
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
  occupiedCells.push({ x: deepestNode.x, y: deepestNode.y, floor: deepestNode.floor });

  // Helper to determine if a cell is a straight corridor (has exactly 2 opposite walls)
  const isStraightCorridor = (cell) => {
    const { x, y, floor } = cell;
    const grid = floors[floor];
    const isWallCell = (tx, ty) => {
      if (tx < 0 || tx >= width || ty < 0 || ty >= height) return true;
      return grid[ty][tx].type === "wall";
    };
    const westIsWall = isWallCell(x - 1, y);
    const eastIsWall = isWallCell(x + 1, y);
    const northIsWall = isWallCell(x, y - 1);
    const southIsWall = isWallCell(x, y + 1);
    
    // Straight North/South corridor: walls on West & East, floors on North & South
    const isNS = westIsWall && eastIsWall && !northIsWall && !southIsWall;
    // Straight East/West corridor: walls on North & South, floors on West & East
    const isEW = northIsWall && southIsWall && !westIsWall && !eastIsWall;
    return isNS || isEW;
  };

  // Helper to search for the nearest straight corridor node along the critical path to place obstacles cleanly
  const findBestObstacleNode = (targetIndex) => {
    let offset = 0;
    while (targetIndex + offset < critPath.length || targetIndex - offset >= 0) {
      const idx1 = targetIndex + offset;
      const idx2 = targetIndex - offset;
      if (idx1 < critPath.length && isStraightCorridor(critPath[idx1])) {
        return critPath[idx1];
      }
      if (idx2 >= 0 && isStraightCorridor(critPath[idx2])) {
        return critPath[idx2];
      }
      offset++;
    }
    return critPath[targetIndex]; // absolute fallback
  };

  // 5. Place Gates / Obstacles along the 3D Critical Path
  const pathLen = critPath.length;
  const b1Node = findBestObstacleNode(Math.floor(pathLen * 0.25));
  const b2Node = findBestObstacleNode(Math.floor(pathLen * 0.50));
  const b3Node = findBestObstacleNode(Math.floor(pathLen * 0.75));

  const barrierNodes = {
    b1: b1Node,
    b2: b2Node,
    b3: b3Node
  };

  // Dynamically select and shuffle obstacle types for critical path checkpoints (chasm removed; rope is strictly for lower floor descent)
  const obTypes = ["gate", "ivy", "barricade", "codeLock"];
  for (let i = obTypes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = obTypes[i];
    obTypes[i] = obTypes[j];
    obTypes[j] = temp;
  }
  const type1 = obTypes[0];
  const type2 = obTypes[1];
  const type3 = obTypes[2];

  // Configure checkpoint obstacles (ensuring they block paths)
  const doorCode = Math.floor(1000 + Math.random() * 9000).toString();

  floors[barrierNodes.b1.floor][barrierNodes.b1.y][barrierNodes.b1.x].obstacle = { type: type1, resolved: false };
  if (type1 === "codeLock") floors[barrierNodes.b1.floor][barrierNodes.b1.y][barrierNodes.b1.x].obstacle.code = doorCode;

  floors[barrierNodes.b2.floor][barrierNodes.b2.y][barrierNodes.b2.x].obstacle = { type: type2, resolved: false };
  if (type2 === "codeLock") floors[barrierNodes.b2.floor][barrierNodes.b2.y][barrierNodes.b2.x].obstacle.code = doorCode;

  floors[barrierNodes.b3.floor][barrierNodes.b3.y][barrierNodes.b3.x].obstacle = { type: type3, resolved: false };
  if (type3 === "codeLock") floors[barrierNodes.b3.floor][barrierNodes.b3.y][barrierNodes.b3.x].obstacle.code = doorCode;

  occupiedCells.push({ x: barrierNodes.b1.x, y: barrierNodes.b1.y, floor: barrierNodes.b1.floor });
  occupiedCells.push({ x: barrierNodes.b2.x, y: barrierNodes.b2.y, floor: barrierNodes.b2.floor });
  occupiedCells.push({ x: barrierNodes.b3.x, y: barrierNodes.b3.y, floor: barrierNodes.b3.floor });

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
    const listWithWall = [];
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
              !c.puzzleClue &&
              !c.loreParchment) {
            list.push(c);
            // Check if there is an adjacent wall
            const hasWall = floors[f][y-1][x].type === "wall" ||
                            floors[f][y+1][x].type === "wall" ||
                            floors[f][y][x-1].type === "wall" ||
                            floors[f][y][x+1].type === "wall";
            if (hasWall) {
              listWithWall.push(c);
            }
          }
        }
      }
    }
    return listWithWall.length > 0 ? listWithWall : list;
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

  const getFarFreeCells = (rNum, minDist = 3, requireWall = false) => {
    let list = getFreeCellsInRegion(rNum);
    
    // Filter out cells that don't have adjacent walls if requested
    if (requireWall) {
      list = list.filter(c => {
        return floors[c.floor][c.y-1][c.x].type === "wall" ||
               floors[c.floor][c.y+1][c.x].type === "wall" ||
               floors[c.floor][c.y][c.x-1].type === "wall" ||
               floors[c.floor][c.y][c.x+1].type === "wall";
      });
    }

    // Filter by occupied cells distance
    let filtered = list.filter(c => {
      return occupiedCells.every(pos => {
        if (pos.floor !== c.floor) return true;
        const dist = Math.abs(pos.x - c.x) + Math.abs(pos.y - c.y);
        return dist >= minDist;
      });
    });
    
    // Fallback if no cells satisfy minDist
    if (filtered.length === 0 && minDist > 1) {
      return getFarFreeCells(rNum, minDist - 1, requireWall);
    }
    return filtered;
  };

  const placeItemInRegion = (rNum, itemConfig, minDist = 3, requireWall = false) => {
    let list = getDeadEndsInRegion(rNum);
    
    // Filter dead ends to be far from occupied cells
    let filteredList = list.filter(c => {
      return occupiedCells.every(pos => {
        if (pos.floor !== c.floor) return true;
        const dist = Math.abs(pos.x - c.x) + Math.abs(pos.y - c.y);
        return dist >= minDist;
      });
    });

    if (filteredList.length === 0) {
      filteredList = getFarFreeCells(rNum, minDist, requireWall);
    }

    if (filteredList.length > 0) {
      const cell = filteredList[Math.floor(Math.random() * filteredList.length)];
      cell.chest = itemConfig;
      occupiedCells.push({ x: cell.x, y: cell.y, floor: cell.floor });
      return cell;
    }
    return null;
  };

  // Region 0 setup
  const reg0Free = getFarFreeCells(0, 3);
  let wellCell = null;
  if (reg0Free.length > 0) {
    // Pick a well cell far from start (distance >= 12)
    let filtered = reg0Free.filter(c => Math.abs(c.x - 1) + Math.abs(c.y - 1) >= 12);
    if (filtered.length === 0) filtered = reg0Free;
    wellCell = filtered[Math.floor(Math.random() * filtered.length)];
    wellCell.npc = { id: "well", name: "Deep Well", spokenTo: false };
    occupiedCells.push({ x: wellCell.x, y: wellCell.y, floor: wellCell.floor });
  }

  // Helper to dynamically place a roadblock solver in a region
  const placeRoadblockSolver = (rNum, type, prevNode, nextNode) => {
    if (type === "gate") {
      placeItemInRegion(rNum, { id: `chest_key_r${rNum}`, opened: false, content: { type: "item", item: "key", gold: 5 } }, 10);
    } else if (type === "ivy") {
      placeItemInRegion(rNum, { id: `chest_shears_r${rNum}`, opened: false, content: { type: "item", item: "shears", gold: 5 } }, 10);
    } else if (type === "barricade") {
      placeItemInRegion(rNum, { id: `chest_axe_r${rNum}`, opened: false, content: { type: "item", item: "axe", gold: 5 } }, 10);
    } else if (type === "chasm") {
      placeItemInRegion(rNum, { id: `chest_rope_r${rNum}`, opened: false, content: { type: "item", item: "rope", gold: 5 } }, 10);
    } else if (type === "codeLock") {
      const regFree = getFarFreeCells(rNum, 3, true);
      let clueCell = null;
      if (regFree.length > 0) {
        let filtered = regFree.filter(c => {
          const distToPrev = prevNode ? (Math.abs(c.x - prevNode.x) + Math.abs(c.y - prevNode.y)) : 999;
          const distToNext = nextNode ? (Math.abs(c.x - nextNode.x) + Math.abs(c.y - nextNode.y)) : 999;
          return distToNext >= 10 && distToPrev >= 10;
        });
        if (filtered.length === 0) filtered = regFree;
        clueCell = filtered[Math.floor(Math.random() * filtered.length)];
        clueCell.puzzleClue = doorCode;
        occupiedCells.push({ x: clueCell.x, y: clueCell.y, floor: clueCell.floor });
      }
    }
  };

  // Place Bucket far from Well and Start
  placeItemInRegion(0, { id: "chest_bucket", opened: false, content: { type: "item", item: "bucket", gold: 10 } }, 12);

  // Place roadblock solver for B1 in Region 0
  placeRoadblockSolver(0, type1, { x: 1, y: 1, floor: 0 }, barrierNodes.b1);

  // Place Rope if there are multiple floors so the player is guaranteed to be able to descend
  if (numFloors > 1) {
    placeItemInRegion(0, { id: "chest_rope", opened: false, content: { type: "item", item: "rope", gold: 5 } }, 8);
  }

  // Region 1 setup
  const reg1Free = getFarFreeCells(1, 3);
  let childCell = null;
  if (reg1Free.length > 0) {
    // Pick Lost Child location far from Region 1 entrance (distance >= 12)
    let filtered = reg1Free.filter(c => Math.abs(c.x - barrierNodes.b1.x) + Math.abs(c.y - barrierNodes.b1.y) >= 12);
    if (filtered.length === 0) filtered = reg1Free;
    childCell = filtered[Math.floor(Math.random() * filtered.length)];
    childCell.npc = { id: "child", name: "Lost Child", spokenTo: false };
    occupiedCells.push({ x: childCell.x, y: childCell.y, floor: childCell.floor });
  }

  // Place roadblock solver for B2 in Region 1
  placeRoadblockSolver(1, type2, barrierNodes.b1, barrierNodes.b2);

  // Place Cheese far from Child, entrance, and other items
  placeItemInRegion(1, { id: "chest_cheese", opened: false, content: { type: "item", item: "cheese", gold: 5 } }, 10);

  // Place Mouse far from other Region 1 elements
  const reg1NpcFree = getFarFreeCells(1, 8);
  if (reg1NpcFree.length > 0) {
    const mouseCell = reg1NpcFree[Math.floor(Math.random() * reg1NpcFree.length)];
    mouseCell.npc = { id: "mouse", name: "Talking Mouse", spokenTo: false };
    occupiedCells.push({ x: mouseCell.x, y: mouseCell.y, floor: mouseCell.floor });
  }

  // Region 2 setup
  // Place roadblock solver for B3 in Region 2
  placeRoadblockSolver(2, type3, barrierNodes.b2, barrierNodes.b3);

  // Place Merchant far from entrance and Code Lock Clue
  const reg2NpcFree = getFarFreeCells(2, 8);
  if (reg2NpcFree.length > 0) {
    const merchantCell = reg2NpcFree[Math.floor(Math.random() * reg2NpcFree.length)];
    merchantCell.npc = { id: "merchant", name: "Lost Merchant", spokenTo: false };
    occupiedCells.push({ x: merchantCell.x, y: merchantCell.y, floor: merchantCell.floor });
  }

  // Force the Old Sage to spawn at the start cell adjacent path on Floor 0
  const startFloor = floors[0];
  let sageCell = null;
  if (startFloor[2] && startFloor[2][1] && startFloor[2][1].type === "floor") {
    sageCell = startFloor[2][1];
  } else if (startFloor[1] && startFloor[1][2] && startFloor[1][2].type === "floor") {
    sageCell = startFloor[1][2];
  }
  if (sageCell) {
    sageCell.npc = { id: "traveler", name: "Old Sage", spokenTo: false };
    occupiedCells.push({ x: sageCell.x, y: sageCell.y, floor: sageCell.floor });
  } else {
    // Fallback if somehow path is not adjacent
    const travelerFree = getFarFreeCells(0, 3);
    if (travelerFree.length > 0) {
      const travelerCell = travelerFree[Math.floor(Math.random() * travelerFree.length)];
      travelerCell.npc = { id: "traveler", name: "Old Sage", spokenTo: false };
      occupiedCells.push({ x: travelerCell.x, y: travelerCell.y, floor: travelerCell.floor });
    }
  }

  // Scatter exactly 3 Lore Parchments across the regions (strictly on walls!)
  // Lore 1 in Region 0 or 1
  const lore1Free = getFarFreeCells(Math.random() < 0.5 ? 0 : 1, 4, true);
  if (lore1Free.length > 0) {
    const c = lore1Free[Math.floor(Math.random() * lore1Free.length)];
    c.loreParchment = "lore_1";
    occupiedCells.push({ x: c.x, y: c.y, floor: c.floor });
  }
  // Lore 2 in Region 2
  const lore2Free = getFarFreeCells(2, 4, true);
  if (lore2Free.length > 0) {
    const c = lore2Free[Math.floor(Math.random() * lore2Free.length)];
    c.loreParchment = "lore_2";
    occupiedCells.push({ x: c.x, y: c.y, floor: c.floor });
  }
  // Lore 3 in Region 3
  const lore3Free = getFarFreeCells(3, 4, true);
  if (lore3Free.length > 0) {
    const c = lore3Free[Math.floor(Math.random() * lore3Free.length)];
    c.loreParchment = "lore_3";
    occupiedCells.push({ x: c.x, y: c.y, floor: c.floor });
  }

  // 11. Populate remaining dead-end chests with gold, fuel, or non-repeating unique rewards
  const placedUniqueItems = new Set();
  const uniqueItemsPool = ["compass", "map_piece", "cheese"];

  for (let r = 0; r < 4; r++) {
    const deadEnds = getDeadEndsInRegion(r).filter(c => !c.chest && !c.npc && !c.puzzleClue && !c.isEntrance && !c.isExit);
    deadEnds.forEach((c, idx) => {
      const roll = Math.random();
      let chestContent = {};
      if (roll < 0.75) {
        const rewardRoll = Math.random();
        // 65% Gold, 25% Fuel, 10% Unique Item (at most 1 of each per maze level)
        if (rewardRoll < 0.65) {
          chestContent = { type: "gold", amount: 15 + Math.floor(Math.random() * 25) };
        } else if (rewardRoll < 0.90) {
          chestContent = { type: "item", item: "fuel", gold: 5 + Math.floor(Math.random() * 10) };
        } else {
          // Unique item roll
          const availableUniques = uniqueItemsPool.filter(item => !placedUniqueItems.has(item));
          if (availableUniques.length > 0) {
            const picked = availableUniques[Math.floor(Math.random() * availableUniques.length)];
            placedUniqueItems.add(picked);
            chestContent = { type: "item", item: picked, gold: 5 + Math.floor(Math.random() * 10) };
          } else {
            // Fallback to gold if all unique items have already been placed
            chestContent = { type: "gold", amount: 20 + Math.floor(Math.random() * 15) };
          }
        }
      } else if (roll < 0.90) {
        chestContent = { type: "trap", damage: 25 }; // Constant 25 damage (survive up to 3 chests)
      } else {
        chestContent = { type: "mimic", damage: 25 }; // Constant 25 damage (survive up to 3 chests)
      }

      c.chest = {
        id: `chest_f${c.floor}_r${r}_${idx}`,
        opened: false,
        content: chestContent
      };
      occupiedCells.push({ x: c.x, y: c.y, floor: c.floor });
    });
  }

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
