// src/utils/gameLogic.js

const GAME_WIDTH = 40;
const GAME_HEIGHT = 30;

export const TILE_YIELDS = {
    grass: { food: 2, production: 0, gold: 0, science: 0, culture: 0 },
    plains: { food: 1, production: 1, gold: 0, science: 0, culture: 0 },
    forest: { food: 1, production: 2, gold: 0, science: 0, culture: 0 },
    desert: { food: 0, production: 0, gold: 1, science: 0, culture: 0 },
    mountain: { food: 0, production: 1, gold: 0, science: 0, culture: 0 },
    water: { food: 1, production: 0, gold: 0, science: 0, culture: 0 },
    hills: {food: 1, production: 2, gold: 0, science: 0, culture: 0 },
    tundra: {food: 1, production: 0, gold: 0, science: 0, culture: 0},
    jungle: {food: 1, production: 1, gold: 0, science: 1, culture: 0}
};

export const RESOURCE_YIELDS = {
    grain: { food: 2 },
    fish: { food: 2 },
    cattle: { food: 1, production: 1},
    fruit: {food: 2, gold: 1},
    wood: { production: 1 },
    iron: { production: 2 },
    stone: {production: 1},
    horses: {production: 1, food: 1},
    gold_vein: { gold: 3 },
    gems: {gold: 2, culture: 1},
    spices: {gold: 2},
    ancient_ruins: {science: 2, culture: 1},
};

export const AI_FACTIONS_DATA = {
    red: {
        name: "Римская империя",
        leaderName: "Цезарь",
        cityNames: ["Рим", "Анциум", "Равенна", "Капуя", "Брундизий", "Тарент", "Сиракузы", "Неаполь", "Тускулум", "Помпеи"]
    },
    blue: {
        name: "Греческий полис",
        leaderName: "Перикл",
        cityNames: ["Афины", "Спарта", "Коринф", "Фивы", "Дельфы", "Олимпия", "Милет", "Эфес", "Родос", "Аргос"]
    },
    green: {
        name: "Персидская держава",
        leaderName: "Дарий",
        cityNames: ["Персеполь", "Сузы", "Экбатана", "Пасаргады", "Вавилон", "Сарды", "Дамаск", "Тир", "Ниневия", "Мемфис"]
    },
    yellow: {
        name: "Карфаген",
        leaderName: "Ганнибал",
        cityNames: ["Карфаген", "Утика", "Гадес", "Новый Карфаген", "Гиппон Регий", "Лептис", "Сабрата", "Тапс", "Тингис", "Икосиум"]
    }
};

export const generateMap = (width, height) => {
    const map = [];

    // Начинаем с разнообразного рельефа, а не с полностью водной карты
    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            const baseType = Math.random() < 0.35 ? 'water' : 'grass'; // Снижаем до 35% шанс появления воды
            row.push({
                type: baseType,
                discovered: false,
                food: baseType === 'water' ? 1 : 2,
                production: baseType === 'water' ? 0 : 1,
                gold: 0,
                science: 0,
                culture: 0,
                resource: null,
                improvement: null
            });
        }
        map.push(row);
    }

    // Создаем несколько очагов суши - больше и крупнее
    const landSeeds = Math.max(4, Math.floor(width * height / 300)); // Увеличиваем количество очагов суши
    const seeds = [];

    for (let i = 0; i < landSeeds; i++) {
        const seedX = Math.floor(Math.random() * width);
        const seedY = Math.floor(Math.random() * height);
        seeds.push({x: seedX, y: seedY});

        // Создаем большой участок земли вокруг каждого очага
        const landRadius = Math.floor(Math.random() * 5) + 12; // Увеличиваем радиус до 12-17 клеток
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const distance = Math.sqrt(Math.pow(x - seedX, 2) + Math.pow(y - seedY, 2));
                if (distance <= landRadius) {
                    // Чем ближе к центру, тем больше вероятность суши
                    const landProbability = 1.2 - (distance / landRadius); // Увеличиваем шанс появления суши
                    if (Math.random() < landProbability) {
                        const rNoise = Math.random();
                        let type = 'grass';
                        if (rNoise < 0.04) type = 'mountain';
                        else if (rNoise < 0.24) type = 'forest';
                        else if (rNoise < 0.49) type = 'plains';
                        else if (rNoise < 0.69) type = 'grass';
                        else if (rNoise < 0.79) type = 'hills';
                        else if (rNoise < 0.89) type = 'desert';
                        else if (rNoise < 0.97) type = 'jungle';
                        else type = 'tundra';

                        map[y][x].type = type;

                        // Устанавливаем базовые доходы в зависимости от типа местности
                        let baseYields = TILE_YIELDS[type] || { food: 0, production: 0, gold: 0, science: 0, culture: 0 };
                        map[y][x].food = baseYields.food || 0;
                        map[y][x].production = baseYields.production || 0;
                        map[y][x].gold = baseYields.gold || 0;
                        map[y][x].science = baseYields.science || 0;
                        map[y][x].culture = baseYields.culture || 0;
                    }
                }
            }
        }
    }


    // Добавляем ресурсы на карту
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const tile = map[y][x];
            const resChance = Math.random();
            let resource = null;

            if (tile.type === 'forest' && resChance < 0.25) resource = Math.random() < 0.5 ? 'wood' : 'fruit';
            else if ((tile.type === 'grass' || tile.type === 'plains') && resChance < 0.3) resource = Math.random() < 0.6 ? 'grain' : 'cattle';
            else if (tile.type === 'plains' && resChance < 0.15) resource = 'horses';
            else if ((tile.type === 'mountain' || tile.type === 'hills') && resChance < 0.2) resource = Math.random() < 0.6 ? 'iron' : 'stone';
            else if ((tile.type === 'desert' || tile.type === 'mountain') && resChance < 0.15) resource = 'gold_vein';
            else if (tile.type === 'desert' && resChance < 0.1) resource = 'spices';
            else if (tile.type === 'jungle' && resChance < 0.2) resource = Math.random() < 0.5 ? 'fruit' : 'spices';
            else if (tile.type === 'water' && resChance < 0.40) resource = 'fish';
            else if (tile.type === 'tundra' && resChance < 0.1) resource = 'gems';
            else if (resChance < 0.01 && tile.type !== 'water') resource = 'ancient_ruins';

            if (resource) {
                tile.resource = resource;
                let resourceYields = RESOURCE_YIELDS[resource] || {};
                tile.food += resourceYields.food || 0;
                tile.production += resourceYields.production || 0;
                tile.gold += resourceYields.gold || 0;
                tile.science += resourceYields.science || 0;
                tile.culture += resourceYields.culture || 0;
            }
        }
    }

    return map;
};

const offsetToCube = (col, row) => {
    const x = col - (row - (row & 1)) / 2;
    const z = row;
    const y = -x - z;
    return { x, y, z };
};
const cubeDistance = (a, b) => (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z)) / 2;
export const calculateDistance = (x1, y1, x2, y2) => cubeDistance(offsetToCube(x1, y1), offsetToCube(x2, y2));

export const getAdjacentTiles = (x, y, map) => {
    const neighbors = [];
    const directions = [
        { q: +1, r:  0 }, { q: +1, r: -1 }, { q:  0, r: -1 },
        { q: -1, r:  0 }, { q: -1, r: +1 }, { q:  0, r: +1 },
    ];
    const selfCube = offsetToCube(x, y);
    for (const dir of directions) {
        const neighborCube = { x: selfCube.x + dir.q, y: selfCube.y - dir.q - dir.r, z: selfCube.z + dir.r };
        const nCol = neighborCube.x + (neighborCube.z - (neighborCube.z & 1)) / 2;
        const nRow = neighborCube.z;
        if (nRow >= 0 && nRow < map.length && nCol >= 0 && nCol < map[0].length) {
            if (map[nRow]?.[nCol]) {
                neighbors.push({ x: nCol, y: nRow, ...map[nRow][nCol] });
            }
        }
    }
    return neighbors;
};

export const revealMapAround = (map, x, y, radius) => {
    if (!map || !map.length) return;
    const height = map.length;
    const width = map[0].length;
    for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
            if (calculateDistance(x, y, c, r) <= radius) {
                if (map[r]?.[c]) map[r][c].discovered = true;
            }
        }
    }
};

export const calculateCityProduction = (city, map, buildingTypesObject, unitTypesObject) => {
    if (!city || !map || !buildingTypesObject) return { foodYield: 0, foodNet:0, productionYield: 0, goldYield:0, goldNetFromCity: 0, scienceYield: 0, cultureYield: 0 };
    let foodFromTiles = 0;
    let prodFromTiles = 0;
    let goldFromTiles = 0;
    let scienceFromTiles = 0;
    let cultureFromTiles = 0;
    const cityTile = map[city.y]?.[city.x];
    if (cityTile) {
        foodFromTiles += cityTile.food || 0;
        prodFromTiles += cityTile.production || 0;
        goldFromTiles += cityTile.gold || 0;
        scienceFromTiles += cityTile.science || 0;
        cultureFromTiles += cityTile.culture || 0;
    } else {
        foodFromTiles = 1; prodFromTiles = 1;
    }
    scienceFromTiles += 1; // Базовая наука города
    cultureFromTiles += 1; // Базовая культура города

    (city.workingTiles || []).forEach(tileCoords => {
        const tile = map[tileCoords.y]?.[tileCoords.x];
        if (tile) {
            foodFromTiles += tile.food || 0;
            prodFromTiles += tile.production || 0;
            goldFromTiles += tile.gold || 0;
            scienceFromTiles += tile.science || 0;
            cultureFromTiles += tile.culture || 0;
        }
    });

    let foodBonusFromBuildings = 0;
    let prodBonusFromBuildings = 0;
    let goldBonusFromBuildings = 0;
    let scienceBonusFromBuildings = 0;
    let cultureBonusFromBuildings = 0;
    let cityBuildingMaintenance = 0;

    (city.buildings || []).forEach(builtBuilding => {
        const buildingData = buildingTypesObject[builtBuilding.id];
        if (buildingData) {
            if (buildingData.effect === 'food') foodBonusFromBuildings += buildingData.bonus || 0;
            if (buildingData.effect === 'production') prodBonusFromBuildings += buildingData.bonus || 0;
            if (buildingData.effect === 'gold') goldBonusFromBuildings += buildingData.bonus || 0;
            if (buildingData.effect === 'science') scienceBonusFromBuildings += buildingData.bonus || 0;
            if (buildingData.effect === 'culture') cultureBonusFromBuildings += buildingData.bonus || 0;
            if (buildingData.id === 'HARBOR' && city.coastal) prodBonusFromBuildings += buildingData.bonus || 0;
            cityBuildingMaintenance += buildingData.maintainCost || 0;
        }
    });

    const population = city.population || 1;
    const foodConsumedByPop = population * 2; // Каждый житель потребляет 2 еды
    const scienceFromPop = Math.floor(population * 0.75); // Наука от населения
    const goldFromPop = Math.floor(population * 0.35); // Золото от населения

    const totalFoodYield = foodFromTiles + foodBonusFromBuildings;
    const totalProductionYield = prodFromTiles + prodBonusFromBuildings;
    const totalGoldYield = goldFromTiles + goldBonusFromBuildings + goldFromPop;
    const totalScienceYield = scienceFromTiles + scienceBonusFromBuildings + scienceFromPop;
    const totalCultureYield = cultureFromTiles + cultureBonusFromBuildings;

    const netFood = totalFoodYield - foodConsumedByPop;
    const netGoldFromCityOperations = totalGoldYield - cityBuildingMaintenance;

    return {
        foodYield: totalFoodYield, foodNet: netFood,
        productionYield: Math.max(1, totalProductionYield), // Минимум 1 производство
        goldYield: totalGoldYield, goldNetFromCity: netGoldFromCityOperations,
        scienceYield: Math.max(0, totalScienceYield),
        cultureYield: Math.max(1, totalCultureYield),
    };
};

export const canUnitMoveTo = (unit, targetX, targetY, map, allUnits) => {
    if (!unit || !map || !map.length) return false;
    if (targetX < 0 || targetX >= map[0].length || targetY < 0 || targetY >= map.length) return false;
    const targetTile = map[targetY]?.[targetX];
    if (!targetTile || !targetTile.discovered) return false;

    // Проверка для морских и наземных юнитов
    if (unit.naval) {
        if (targetTile.type !== 'water') return false;
    } else {
        if (targetTile.type === 'water' || targetTile.type === 'mountain') return false;
    }

    // Проверка наличия юнита на целевой клетке
    const unitOnTargetTile = allUnits.find(u => u.x === targetX && u.y === targetY && u.id !== unit.id);
    return !unitOnTargetTile;
};

export const getMovableTiles = (unit, map, allUnits) => {
    if (!unit || !map || !map.length || (unit.movesLeft || 0) <= 0) return [];
    const movable = [];
    const queue = [{ x: unit.x, y: unit.y, movesRemaining: unit.movesLeft, path: [] }];
    const visited = new Set([`${unit.x},${unit.y}`]);

    while (queue.length > 0) {
        const current = queue.shift();
        if (current.path.length > 0) {
            movable.push({
                x: current.x,
                y: current.y,
                cost: current.path.length,
                movesLeftAfterMove: current.movesRemaining
            });
        }

        if (current.movesRemaining > 0) {
            const neighbors = getAdjacentTiles(current.x, current.y, map);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;

                // Расчет стоимости перемещения в зависимости от типа местности
                let costToEnterNeighbor = 1; // Базовая стоимость

                // Увеличенная стоимость для трудных ландшафтов
                if (neighbor.type === 'forest' || neighbor.type === 'jungle')
                    costToEnterNeighbor = unit.naval ? Infinity : 1.5;
                else if (neighbor.type === 'hills')
                    costToEnterNeighbor = unit.naval ? Infinity : 2;
                else if (neighbor.type === 'mountain')
                    costToEnterNeighbor = Infinity; // Нельзя проходить горы
                else if (neighbor.type === 'water')
                    costToEnterNeighbor = unit.naval ? 1 : Infinity;

                // Округляем стоимость вверх
                costToEnterNeighbor = Math.ceil(costToEnterNeighbor);

                if (current.movesRemaining >= costToEnterNeighbor &&
                    !visited.has(neighborKey) &&
                    canUnitMoveTo(unit, neighbor.x, neighbor.y, map, allUnits)) {
                    visited.add(neighborKey);
                    queue.push({
                        x: neighbor.x,
                        y: neighbor.y,
                        movesRemaining: current.movesRemaining - costToEnterNeighbor,
                        path: [...current.path, {x: current.x, y: current.y}]
                    });
                }
            }
        }
    }

    return movable;
};

export const canAttackTarget = (attacker, target, map) => {
    if (!attacker || !target || attacker.owner === target.owner) return false;
    const isAttackerNaval = attacker.naval;
    const isTargetNaval = target.naval;

    // Проверка возможности атаки между морскими и наземными юнитами
    if (isAttackerNaval !== isTargetNaval) {
        const distance = calculateDistance(attacker.x, attacker.y, target.x, target.y);
        // Морские юниты могут атаковать наземные только с дальности 1, если нет дальнего боя
        if (distance > 1 && (attacker.attackRange || 1) === 1) return false;
    }

    // Проверка дальности атаки
    const distance = calculateDistance(attacker.x, attacker.y, target.x, target.y);
    return distance <= (attacker.attackRange || 1);
};

export const generateStartingUnits = (map, owner, unitTypes) => {
    const width = map[0].length;
    const height = map.length;
    let startX, startY, attempts = 0;

    // Поиск подходящей начальной позиции
    do {
        startX = Math.floor(width / 3 + Math.random() * (width / 3));
        startY = Math.floor(height / 3 + Math.random() * (height / 3));
        startX = Math.max(1, Math.min(width - 2, startX));
        startY = Math.max(1, Math.min(height - 2, startY));
        attempts++;
    } while (attempts < 200 && (!map[startY]?.[startX] || map[startY][startX].type === 'water' || map[startY][startX].type === 'mountain'));

    // Если не найдено подходящее место, используем центр карты
    if (!map[startY]?.[startX] || map[startY][startX].type === 'water' || map[startY][startX].type === 'mountain') {
        startX = Math.floor(width/2);
        startY = Math.floor(height/2);
        if (map[startY]?.[startX]) map[startY][startX].type = 'grass';
        else return [];
    }

    // Создание начальных юнитов
    const settlerData = unitTypes['SETTLER'];
    const warriorData = unitTypes['WARRIOR'];
    if (!settlerData || !warriorData) return [];

    // Открываем карту вокруг начальной позиции
    revealMapAround(map, startX, startY, 3);

    // Подготовка позиции для воина
    let warriorX = startX + 1;
    let warriorY = startY;
    if (warriorX >= width || map[warriorY]?.[warriorX]?.type === 'mountain' || map[warriorY]?.[warriorX]?.type === 'water') {
        warriorX = startX - 1;
        if (warriorX < 0 || map[warriorY]?.[warriorX]?.type === 'mountain' || map[warriorY]?.[warriorX]?.type === 'water') {
            warriorX = startX;
            warriorY = startY + 1;
            if (warriorY >= height || map[warriorY]?.[warriorX]?.type === 'mountain' || map[warriorY]?.[warriorX]?.type === 'water') {
                warriorY = startY - 1;
            }
        }
    }

    // Окончательные проверки позиции воина
    warriorX = Math.max(0, Math.min(width - 1, warriorX));
    warriorY = Math.max(0, Math.min(height - 1, warriorY));
    if (map[warriorY]?.[warriorX]?.type === 'mountain' || map[warriorY]?.[warriorX]?.type === 'water') {
        warriorX = startX;
        warriorY = startY;
    }

    // Возвращаем созданный отряд юнитов
    return [
        { ...settlerData, id: `settler_${owner}_${Date.now()}`, owner, x: startX, y: startY, health: settlerData.maxHealth, movesLeft: settlerData.maxMoves, hasAttacked:false },
        { ...warriorData, id: `warrior_${owner}_${Date.now()+1}`, owner, x: warriorX, y: warriorY, health: warriorData.maxHealth, movesLeft: warriorData.maxMoves, hasAttacked: false }
    ];
};

export const generateEnemyCities = (map, aiPlayers) => {
    const cities = [];
    const width = map[0].length;
    const height = map.length;
    const minDistanceBetweenCities = 8;
    const minDistanceFromPlayerSpawnZone = 10;
    const playerSpawnApprox = { x: Math.floor(width / 2), y: Math.floor(height / 2) };

    // Для каждой ИИ фракции
    aiPlayers.forEach((faction, factionIndex) => {
        // Пытаемся разместить город
        let cityPlaced = false;
        let attempts = 0;

        while (!cityPlaced && attempts < 150) {
            attempts++;

            // Вычисляем позицию для города на основе индекса фракции - равномерно по кругу
            const angle = (Math.PI * 2 / aiPlayers.length) * factionIndex + (Math.random() * 0.5 - 0.25);
            const distFromCenter = width / 4 + Math.random() * (width / 10);
            const cityX = Math.floor(width / 2 + Math.cos(angle) * distFromCenter);
            const cityY = Math.floor(height / 2 + Math.sin(angle) * distFromCenter);
            const cX = Math.max(1, Math.min(width - 2, cityX));
            const cY = Math.max(1, Math.min(height - 2, cityY));

            if (!map[cY]?.[cX]) continue;

            const tile = map[cY][cX];
            const distToPlayerZone = calculateDistance(cX, cY, playerSpawnApprox.x, playerSpawnApprox.y);

            if (tile.type !== 'water' && tile.type !== 'mountain' && distToPlayerZone >= minDistanceFromPlayerSpawnZone) {
                let tooCloseToOtherAICity = cities.some(c => calculateDistance(cX, cY, c.x, c.y) < minDistanceBetweenCities);

                if (!tooCloseToOtherAICity) {
                    const adjacentTiles = getAdjacentTiles(cX, cY, map);
                    const isCoastal = adjacentTiles.some(adjTile => adjTile?.type === 'water');

                    // Получаем названия городов для фракции
                    const factionData = AI_FACTIONS_DATA[faction] || { cityNames: [`Город ${faction} ${cities.filter(c=>c.owner === faction).length + 1}`] };
                    const cityName = factionData.cityNames[cities.filter(c=>c.owner === faction).length % factionData.cityNames.length];

                    cities.push({
                        id: `city_ai_${faction}_${factionIndex}_${Date.now()}`,
                        name: cityName,
                        owner: faction,
                        x: cX,
                        y: cY,
                        population: 1,
                        buildings: [],
                        productionQueue: null,
                        coastal: isCoastal,
                        defense: 3,
                        health: 100,
                        maxHealth: 100,
                    });

                    revealMapAround(map, cX, cY, 2);
                    cityPlaced = true;
                }
            }
        }
    });

    return cities;
};

export const generateBarbarians = (map, playerStartUnit, count = 3, unitTypes) => {
    if (!map || !map.length || !map[0] || !playerStartUnit || !unitTypes) return [];
    const width = map[0].length;
    const height = map.length;
    const barbarians = [];
    const minDistanceFromPlayer = 10;
    const barbPossibleBaseTypes = ['WARRIOR', 'ARCHER'];

    // Размещаем варваров на карте
    for (let i = 0; i < count; i++) {
        let placed = false;
        let attempts = 0;

        while (!placed && attempts < 100) {
            attempts++;
            const x = Math.floor(Math.random() * width);
            const y = Math.floor(Math.random() * height);

            if (!map[y]?.[x]) continue;

            const tile = map[y][x];
            const distanceToPlayer = calculateDistance(x, y, playerStartUnit.x, playerStartUnit.y);

            // Проверяем, что это подходящая позиция
            if (tile.type !== 'water' && tile.type !== 'mountain' && distanceToPlayer >= minDistanceFromPlayer && !map[y][x].discovered) {
                const baseTypeId = barbPossibleBaseTypes[Math.floor(Math.random() * barbPossibleBaseTypes.length)];
                const baseUnitData = unitTypes[baseTypeId];

                if (baseUnitData) {
                    barbarians.push({
                        ...baseUnitData,
                        id: `barb_${baseTypeId}_${i}_${Date.now()}`,
                        type: `Варвар ${baseUnitData.type.toLowerCase()}`,
                        icon: '👹',
                        owner: 'barbarians',
                        x,
                        y,
                        health: Math.floor(baseUnitData.maxHealth * 0.9),
                        maxHealth: Math.floor(baseUnitData.maxHealth * 0.9),
                        attack: Math.max(1, Math.floor((baseUnitData.attack || 0) * 0.9)),
                        defense: Math.max(0, Math.floor((baseUnitData.defense || 0) * 0.9)),
                        movesLeft: baseUnitData.maxMoves,
                        hasAttacked: false,
                    });

                    placed = true;
                }
            }
        }
    }

    return barbarians;
};

// Константы для лечения юнитов
export const HEAL_RATE_CITY = 5;
export const HEAL_RATE_TERRITORY = 2;

export const healUnits = (units, cities, map, playerNationId) => {
    return units.map(unit => {
        if (unit.health < unit.maxHealth && unit.owner === playerNationId) {
            let healAmount = 0;
            const unitCity = cities.find(c => c.x === unit.x && c.y === unit.y && c.owner === playerNationId);

            if (unitCity) {
                healAmount = HEAL_RATE_CITY;
            } else {
                // Лечение на своей территории
                if (unit.movesLeft === unit.maxMoves) {
                    healAmount = HEAL_RATE_TERRITORY;
                }
            }

            if (healAmount > 0) {
                const newHealth = Math.min(unit.maxHealth, unit.health + healAmount);
                return { ...unit, health: newHealth };
            }
        }
        return unit;
    });
};