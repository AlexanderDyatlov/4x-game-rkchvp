import React, { useState, useEffect } from 'react';
import GameMap from './GameMap';
import GameUI from './GameUI';
import TechTree from './TechTree';
import Civilopedia from './Civilopedia';
import MainMenu from './MainMenu';
import {
    generateMap,
    generateStartingUnits,
    generateEnemyCities,
    generateBarbarians,
    canUnitMoveTo,
    canAttackTarget,
    calculateCityProduction,
    getAdjacentTiles,
    calculateDistance,
    revealMapAround,
    getMovableTiles,
    healUnits
} from '../utils/gameLogic';

const GAME_WIDTH = 32;
const GAME_HEIGHT = 24;
const DEFAULT_UNIT_MOVES = 2;
const CITY_WORKABLE_RADIUS = 2;
const BASE_FOOD_FOR_GROWTH = 15;
const GROWTH_FACTOR = 5;

// Условия победы
const SCIENCE_VICTORY_TECHS = ['mathematics']; // Обязательная технология
const SCIENCE_VICTORY_COUNT = 5; // Общее количество технологий для победы
const DOMINATION_VICTORY_PERCENT = 70; // Процент контроля городов для победы

export const UNIT_TYPES = {
    SETTLER: { type: 'Поселенец', id: 'SETTLER', attack: 0, defense: 1, maxHealth: 15, maxMoves: 2, cost: 80, productionCost: 80, maintainCost: 0, icon: '👨‍🌾', description: 'Основывает новые города. Исчезает после основания города.', requiresTech: null },
    WARRIOR: { type: 'Воин', id: 'WARRIOR', attack: 8, defense: 6, maxHealth: 25, maxMoves: 2, cost: 50, productionCost: 40, maintainCost: 1, icon: '⚔️', description: 'Базовый боевой юнит для ранней игры и защиты.', requiresTech: null },
    ARCHER: { type: 'Лучник', id: 'ARCHER', attack: 10, defense: 3, maxHealth: 20, maxMoves: 2, cost: 60, productionCost: 50, maintainCost: 1, icon: '🏹', attackRange: 2, description: 'Атакует врагов на расстоянии 2 клеток.', requiresTech: 'archery' },
    HORSEMAN: { type: 'Всадник', id: 'HORSEMAN', attack: 12, defense: 5, maxHealth: 30, maxMoves: 4, cost: 90, productionCost: 80, maintainCost: 2, icon: '🐎', description: 'Быстрый кавалерийский юнит, хорош для разведки и фланговых атак.', requiresTech: 'horseback_riding' },
    SWORDSMAN: { type: 'Мечник', id: 'SWORDSMAN', attack: 15, defense: 10, maxHealth: 35, maxMoves: 2, cost: 100, productionCost: 90, maintainCost: 2, icon: '🗡️', description: 'Мощный пехотный юнит.', requiresTech: 'bronze_working' },
    FISHING_BOAT: { type: 'Рыбацкая лодка', id: 'FISHING_BOAT', attack: 0, defense: 1, maxHealth: 15, maxMoves: 3, cost: 60, productionCost: 50, maintainCost: 1, icon: '🚣', naval: true, description: 'Собирает пищу с водных клеток с рыбой.', requiresTech: 'sailing' },
    GALLEY: { type: 'Галера', id: 'GALLEY', attack: 10, defense: 8, maxHealth: 30, maxMoves: 3, cost: 100, productionCost: 85, maintainCost: 2, icon: '⛵', naval: true, description: 'Ранний морской боевой юнит.', requiresTech: 'sailing' },
    TRIREME: { type: 'Трирема', id: 'TRIREME', attack: 12, defense: 6, maxHealth: 25, maxMoves: 4, cost: 120, productionCost: 100, maintainCost: 3, icon: '🚢', naval: true, attackRange: 2, description: 'Улучшенный морской юнит с возможностью атаковать на расстоянии.', requiresTech: 'naval_warfare' }
};

export const BUILDING_TYPES = {
    GRANARY: { name: 'Амбар', id: 'GRANARY', effect: 'food', bonus: 2, cost: 60, productionCost: 50, maintainCost: 1, icon: '🌾', description: 'Увеличивает производство пищи и ускоряет рост населения.', requiresTech: 'agriculture' },
    SAWMILL: { name: 'Лесопилка', id: 'SAWMILL', effect: 'production', bonus: 1, cost: 50, productionCost: 40, maintainCost: 1, icon: '🪵', description: 'Увеличивает производство в городе, особенно если рядом есть леса.', requiresTech: 'woodworking' },
    MINE: { name: 'Шахта', id: 'MINE', effect: 'production', bonus: 2, cost: 70, productionCost: 60, maintainCost: 1, icon: '⛏️', description: 'Значительно увеличивает производство, особенно на холмах или с ресурсами.', requiresTech: 'mining' },
    LIBRARY: { name: 'Библиотека', id: 'LIBRARY', effect: 'science', bonus: 3, cost: 80, productionCost: 75, maintainCost: 1, icon: '📚', description: 'Увеличивает производство науки в городе.', requiresTech: 'writing' },
    MARKET: { name: 'Рынок', id: 'MARKET', effect: 'gold', bonus: 3, cost: 100, productionCost: 85, maintainCost: 1, icon: '💰', description: 'Увеличивает доход золота от города.', requiresTech: 'currency' },
    HARBOR: { name: 'Гавань', id: 'HARBOR', effect: 'naval', bonus: 2, cost: 120, productionCost: 100, maintainCost: 2, icon: '🏗️', description: 'Позволяет строить морские юниты и увеличивает торговлю/производство.', requiresTech: 'sailing' }
};

export const TECHNOLOGIES_DATA = [
    { id: 'agriculture', name: 'Земледелие', era: 'Древний мир', cost: 25, prerequisites: [], unlocks: ['GRANARY'], description: 'Позволяет строить амбары и улучшает фермы.', researched: false },
    { id: 'mining', name: 'Горное дело', era: 'Древний мир', cost: 35, prerequisites: [], unlocks: ['MINE'], description: 'Открывает шахты для добычи ресурсов и производства.', researched: false },
    { id: 'sailing', name: 'Мореходство', era: 'Древний мир', cost: 40, prerequisites: [], unlocks: ['FISHING_BOAT', 'HARBOR', 'GALLEY'], description: 'Позволяет строить лодки, галеры и гавани.', researched: false },
    { id: 'archery', name: 'Стрельба из лука', era: 'Древний мир', cost: 40, prerequisites: [], unlocks: ['ARCHER'], description: 'Открывает юниты лучников.', researched: true },
    { id: 'woodworking', name: 'Деревообработка', era: 'Древний мир', cost: 30, prerequisites: [], unlocks: ['SAWMILL'], description: 'Позволяет строить лесопилки.', researched: false },
    { id: 'writing', name: 'Письменность', era: 'Древний мир', cost: 55, prerequisites: [], unlocks: ['LIBRARY'], description: 'Открывает библиотеки для ускорения науки.', researched: false },
    { id: 'bronze_working', name: 'Обработка бронзы', era: 'Древний мир', cost: 55, prerequisites: ['mining'], unlocks: ['SWORDSMAN'], description: 'Позволяет создавать мечников.', researched: false },
    { id: 'horseback_riding', name: 'Верховая езда', era: 'Классическая эпоха', cost: 80, prerequisites: [], unlocks: ['HORSEMAN'], description: 'Открывает конные юниты.', researched: false },
    { id: 'currency', name: 'Валюта', era: 'Классическая эпоха', cost: 100, prerequisites: ['writing'], unlocks: ['MARKET'], description: 'Позволяет строить рынки для увеличения дохода.', researched: false },
    { id: 'mathematics', name: 'Математика', era: 'Классическая эпоха', cost: 120, prerequisites: ['writing'], unlocks: [/* Осадные орудия? */], description: 'Улучшает науку и открывает новые возможности.', researched: false },
    { id: 'naval_warfare', name: 'Морской бой', era: 'Классическая эпоха', cost: 110, prerequisites: ['sailing', 'bronze_working'], unlocks: ['TRIREME'], description: 'Улучшает морские боевые юниты.', researched: false },
];

// Список имен для городов игрока
const CUSTOM_CITY_NAMES = [
    "Москва", "Минск", "Полоцк", "Брест", "Санкт-Петербург", "Новгород", "Казань", "Екатеринбург",
    "Владивосток", "Волгоград", "Ярославль", "Краснодар", "Севастополь",
    "Ростов", "Калининград", "Самара", "Нижний Новгород", "Омск",
    "Тюмень", "Уфа", "Красноярск", "Воронеж", "Пермь"
];

const Game = () => {
    const [showMenu, setShowMenu] = useState(true);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [saveName, setSaveName] = useState("");

    const [gameState, setGameState] = useState({
        map: [],
        units: [],
        cities: [],
        gold: 100,
        currentTurn: 1,
        selectedTile: null,
        selectedUnitId: null,
        selectedCityId: null,
        currentResearch: null,
        technologies: TECHNOLOGIES_DATA.map(t => ({ ...t, researched: t.id === 'archery' })),
        movingUnit: null,
        attackingUnit: null,
        gameMessages: ["Добро пожаловать!"],
        viewportPosition: { x: Math.floor(GAME_WIDTH / 2), y: Math.floor(GAME_HEIGHT / 2) },
        aiPlayers: ['red', 'blue', 'green', 'yellow'], // Добавлен 'green' и 'yellow'
        playerNation: 'player',
        possibleMoves: [],
        cityGrowthProgress: {},
        renamingCityId: null,
        customCityName: "",
        gameOver: false,
        victoryType: null
    });

    const [showTechTreeModal, setShowTechTreeModal] = useState(false);
    const [showCivilopediaModal, setShowCivilopediaModal] = useState(false);
    const [civilopediaInitialEntry, setCivilopediaInitialEntry] = useState(null);

    const getWorkableTilesForCityLocal = (cityX, cityY, currentMap, radius = CITY_WORKABLE_RADIUS) => {
        const workable = [];
        if (!currentMap?.length || !currentMap[0] || typeof cityX !== 'number' || typeof cityY !== 'number') return workable;
        const mapH = currentMap.length;
        const mapW = currentMap[0].length;
        for (let y_offset = -radius; y_offset <= radius; y_offset++) {
            for (let x_offset = -radius; x_offset <= radius; x_offset++) {
                const currentX = cityX + x_offset;
                const currentY = cityY + y_offset;
                if (currentX >= 0 && currentX < mapW && currentY >= 0 && currentY < mapH) {
                    if (calculateDistance(cityX, cityY, currentX, currentY) <= radius) {
                        if (currentMap[currentY]?.[currentX]?.discovered && currentMap[currentY]?.[currentX]?.type !== 'mountain') {
                            workable.push({
                                x: currentX, y: currentY,
                                food: currentMap[currentY][currentX].food || 0,
                                production: currentMap[currentY][currentX].production || 0,
                                gold: currentMap[currentY][currentX].gold || 0,
                                type: currentMap[currentY][currentX].type,
                            });
                        }
                    }
                }
            }
        }
        return workable.filter(t => !(t.x === cityX && t.y === cityY));
    };

    // Проверка условий победы
    const checkVictoryConditions = (state) => {
        // Научная победа - исследовать математику и еще 4 технологии (всего 5)
        const hasMathematicsTech = state.technologies.find(t => t.id === 'mathematics')?.researched;
        const researchedTechsCount = state.technologies.filter(t => t.researched).length;

        if (hasMathematicsTech && researchedTechsCount >= SCIENCE_VICTORY_COUNT) {
            return { gameOver: true, victoryType: 'science' };
        }

        // Военная победа (доминирование)
        const totalCities = state.cities.length;
        const playerCities = state.cities.filter(city => city.owner === 'player').length;

        if (totalCities > 0 && (playerCities / totalCities * 100) >= DOMINATION_VICTORY_PERCENT) {
            return { gameOver: true, victoryType: 'domination' };
        }

        return { gameOver: false, victoryType: null };
    };

    // Функции для сохранения и загрузки игры
    const handleSaveGame = () => {
        setSaveName(`Игра - Ход ${gameState.currentTurn}`);
        setShowSaveModal(true);
    };

    const saveGameToStorage = () => {
        try {
            const saveData = {
                meta: {
                    name: saveName || `Игра - Ход ${gameState.currentTurn}`,
                    date: new Date().toISOString()
                },
                gameState: JSON.parse(JSON.stringify(gameState))
            };

            const saveId = `civ_save_${Date.now()}`;
            localStorage.setItem(saveId, JSON.stringify(saveData));

            setShowSaveModal(false);
            setSaveName("");

            setGameState(prev => ({
                ...prev,
                gameMessages: [...prev.gameMessages, `Игра сохранена: "${saveData.meta.name}"`]
            }));
        } catch (e) {
            console.error("Ошибка сохранения:", e);
            alert("Не удалось сохранить игру");
        }
    };

    const handleLoadGame = (loadedGameState) => {
        setGameState(loadedGameState);
        setShowMenu(false);
    };

    const handleExitToMenu = () => {
        if (window.confirm("Вы уверены, что хотите выйти в главное меню? Несохраненный прогресс будет потерян.")) {
            setShowMenu(true);
        }
    };

    const startNewGame = () => {
        const initialMap = generateMap(GAME_WIDTH, GAME_HEIGHT);
        const startingPlayerUnits = generateStartingUnits(initialMap, 'player', UNIT_TYPES);
        const initialAiCitiesRaw = generateEnemyCities(initialMap, gameState.aiPlayers);
        const initialBarbarians = generateBarbarians(initialMap, startingPlayerUnits[0], 5, UNIT_TYPES);

        startingPlayerUnits.forEach(unit => {
            if (unit?.x !== undefined && unit?.y !== undefined) {
                revealMapAround(initialMap, unit.x, unit.y, 3);
            }
        });

        let allCitiesForInit = [...initialAiCitiesRaw];
        let playerUnitsAfterCityFound = [...startingPlayerUnits];

        const firstPlayerSettlerIndex = playerUnitsAfterCityFound.findIndex(u => u.type === 'Поселенец' && u.owner === 'player');
        if (firstPlayerSettlerIndex !== -1) {
            const settler = playerUnitsAfterCityFound[firstPlayerSettlerIndex];
            playerUnitsAfterCityFound.splice(firstPlayerSettlerIndex, 1);

            if (settler) {
                const {x: sx, y: sy} = settler;
                const isCoastal = getAdjacentTiles(sx, sy, initialMap).some(n => n?.type === 'water');
                const workable = getWorkableTilesForCityLocal(sx, sy, initialMap);
                let working = [];
                if (workable.length > 0) working.push({x: workable[0].x, y: workable[0].y});

                const playerCityProd = calculateCityProduction({x: sx, y: sy, population: 1, buildings: [], workingTiles: working, coastal: isCoastal, owner: 'player'}, initialMap, BUILDING_TYPES, UNIT_TYPES);
                allCitiesForInit.unshift({
                    id: `city_player_0_${Date.now()}`, name: "Столица", owner: 'player', x: sx, y: sy, population: 1,
                    buildings: [], workingTiles: working, workableTiles: workable, ...playerCityProd,
                    coastal: isCoastal, defense: 5, productionQueue: null, health: 100, maxHealth: 100,
                });
                revealMapAround(initialMap, sx, sy, 4);
            }
        }

        const citiesWithData = allCitiesForInit.map(city => {
            const workable = getWorkableTilesForCityLocal(city.x, city.y, initialMap);
            let working = [];
            const pop = city.population || 1;
            const sortedWorkableForCity = [...workable].sort((a,b)=>( (initialMap[b.y]?.[b.x]?.food || 0) + (initialMap[b.y]?.[b.x]?.production || 0) * 0.8) - ( (initialMap[a.y]?.[a.x]?.food || 0) + (initialMap[a.y]?.[a.x]?.production || 0) * 0.8));
            for(let i = 0; i < pop && i < sortedWorkableForCity.length; i++) {
                if (sortedWorkableForCity[i]) {
                    working.push({x: sortedWorkableForCity[i].x, y: sortedWorkableForCity[i].y });
                }
            }

            const cityProd = calculateCityProduction({ ...city, workingTiles: working, buildings: city.buildings || [] }, initialMap, BUILDING_TYPES, UNIT_TYPES);
            return {
                ...city,
                ...cityProd,
                productionQueue: city.productionQueue || null,
                workableTiles: workable,
                workingTiles: working,
                buildings: city.buildings || [],
            };
        });

        setGameState(prev => ({
            ...prev,
            map: initialMap,
            units: [...playerUnitsAfterCityFound, ...initialBarbarians],
            cities: citiesWithData,
            gold: 100,
            currentTurn: 1,
            technologies: TECHNOLOGIES_DATA.map(t => ({ ...t, researched: t.id === 'archery' })),
            viewportPosition: citiesWithData.find(c=>c.owner==='player')?.x !== undefined ?
                { x: citiesWithData.find(c=>c.owner==='player').x, y: citiesWithData.find(c=>c.owner==='player').y } :
                (playerUnitsAfterCityFound.length > 0 && playerUnitsAfterCityFound[0]?.x !== undefined ?
                    { x: playerUnitsAfterCityFound[0].x, y: playerUnitsAfterCityFound[0].y } :
                    { x: Math.floor(GAME_WIDTH / 2), y: Math.floor(GAME_HEIGHT / 2) }),
            cityGrowthProgress: citiesWithData.reduce((acc, city) => ({ ...acc, [city.id]: 0 }), {}),
            gameMessages: ["Добро пожаловать!"],
            gameOver: false,
            victoryType: null
        }));

        setShowMenu(false);
    };

    useEffect(() => {
        // При первом рендере мы не стартуем новую игру автоматически,
        // так как теперь показываем главное меню
    }, []);

    const handleEndTurn = () => {
        setGameState(prev => {
            let newState = JSON.parse(JSON.stringify(prev));
            let turnMessages = [];

            newState.units = healUnits(newState.units, newState.cities, newState.map, 'player');

            newState.units = newState.units.map(unit => {
                if (unit.owner === 'player') {
                    const unitTypeData = UNIT_TYPES[unit.id_type || unit.id] || Object.values(UNIT_TYPES).find(ut => ut.type === unit.type);
                    const maxMoves = unitTypeData?.maxMoves || DEFAULT_UNIT_MOVES;
                    return { ...unit, movesLeft: maxMoves, hasAttacked: false };
                }
                return unit;
            });

            let totalPlayerGoldNetIncomeFromCities = 0;
            let totalPlayerScienceOutput = 0;
            let totalPlayerUnitMaintenance = 0;

            newState.units.filter(u => u.owner === 'player').forEach(u => {
                const unitData = UNIT_TYPES[u.id_type || u.id] || Object.values(UNIT_TYPES).find(ut => ut.type === u.type);
                totalPlayerUnitMaintenance += unitData?.maintainCost || 0;
            });

            newState.cities = newState.cities.map(city => {
                if (city.owner !== 'player') return city;
                let updatedCity = { ...city };
                const cityProductions = calculateCityProduction(updatedCity, newState.map, BUILDING_TYPES, UNIT_TYPES);
                updatedCity = { ...updatedCity, ...cityProductions };

                totalPlayerGoldNetIncomeFromCities += updatedCity.goldNetFromCity || 0;
                totalPlayerScienceOutput += updatedCity.scienceYield || 0;

                let currentGrowth = (newState.cityGrowthProgress[updatedCity.id] || 0) + (updatedCity.foodNet || 0);

                if ((updatedCity.foodNet || 0) < 0 && updatedCity.population > 1) {
                    turnMessages.push(`В городе ${updatedCity.name} нехватка еды (${updatedCity.foodNet})!`);
                }

                const foodNeededForGrowth = BASE_FOOD_FOR_GROWTH + ((updatedCity.population || 1) * GROWTH_FACTOR);
                if (currentGrowth >= foodNeededForGrowth) {
                    updatedCity.population = (updatedCity.population || 0) + 1;
                    newState.cityGrowthProgress[updatedCity.id] = currentGrowth - foodNeededForGrowth;
                    turnMessages.push(`Город ${updatedCity.name} вырос до населения ${updatedCity.population}!`);
                    if (updatedCity.workingTiles.length < updatedCity.population) {
                        const workableTilesForCity = getWorkableTilesForCityLocal(updatedCity.x, updatedCity.y, newState.map);
                        const unworkedBestTile = workableTilesForCity
                            .filter(wt => !updatedCity.workingTiles.some(t => t.x === wt.x && t.y === wt.y))
                            .sort((a, b) => (b.food + b.production * 0.8) - (a.food + a.production * 0.8))[0];
                        if (unworkedBestTile) {
                            updatedCity.workingTiles.push({x: unworkedBestTile.x, y: unworkedBestTile.y});
                            const reCalculatedProd = calculateCityProduction(updatedCity, newState.map, BUILDING_TYPES, UNIT_TYPES);
                            updatedCity = { ...updatedCity, ...reCalculatedProd };
                            turnMessages.push(`Новый житель г. ${updatedCity.name} назначен на клетку (${unworkedBestTile.x},${unworkedBestTile.y}).`);
                        }
                    }
                } else {
                    newState.cityGrowthProgress[updatedCity.id] = Math.max(0, currentGrowth);
                }

                if (updatedCity.productionQueue && (updatedCity.productionYield || 0) > 0) {
                    const queueItem = { ...updatedCity.productionQueue };
                    queueItem.progress = (queueItem.progress || 0) + (updatedCity.productionYield || 0);
                    if (queueItem.progress >= queueItem.cost) {
                        turnMessages.push(`В г. ${updatedCity.name} завершено: ${queueItem.name || queueItem.id}.`);
                        if (queueItem.type === 'unit') {
                            const unitData = UNIT_TYPES[queueItem.id];
                            if (unitData) {
                                newState.units.push({
                                    ...unitData, id: `unit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                                    x: updatedCity.x, y: updatedCity.y, health: unitData.maxHealth,
                                    movesLeft: unitData.maxMoves, hasAttacked: false, owner: 'player',
                                });
                            }
                        } else if (queueItem.type === 'building') {
                            const buildingData = BUILDING_TYPES[queueItem.id];
                            if (buildingData) {
                                updatedCity.buildings = [...(updatedCity.buildings || []), { ...buildingData }];
                                const newCityProductionsAfterBuild = calculateCityProduction(updatedCity, newState.map, BUILDING_TYPES, UNIT_TYPES);
                                updatedCity = { ...updatedCity, ...newCityProductionsAfterBuild };
                            }
                        }
                        updatedCity.productionQueue = null;
                    } else {
                        updatedCity.productionQueue = queueItem;
                    }
                }
                return updatedCity;
            });
            newState.gold += totalPlayerGoldNetIncomeFromCities - totalPlayerUnitMaintenance;

            if (newState.gold < 0) {
                turnMessages.push(`Казна пуста (${newState.gold} золота)! Расходы превышают доходы.`);
            }

            if (newState.currentResearch && (totalPlayerScienceOutput > 0 || newState.gold >=0) ) {
                const researchDetails = newState.technologies.find(t => t.id === newState.currentResearch.id);
                if (researchDetails && !researchDetails.researched) {
                    let currentResearchProgress = (newState.currentResearch.progress || 0) + totalPlayerScienceOutput;
                    turnMessages.push(`+${totalPlayerScienceOutput} науки. ${researchDetails.name}: ${currentResearchProgress}/${researchDetails.cost}`);
                    if (currentResearchProgress >= researchDetails.cost) {
                        newState.technologies = newState.technologies.map(t =>
                            t.id === researchDetails.id ? { ...t, researched: true } : t
                        );
                        turnMessages.push(`Технология "${researchDetails.name}" исследована!`);
                        (researchDetails.unlocks || []).forEach(unlockId => {
                            const unlockedUnit = UNIT_TYPES[unlockId];
                            const unlockedBuilding = BUILDING_TYPES[unlockId];
                            if (unlockedUnit) turnMessages.push(`Юнит: ${unlockedUnit.type} доступен.`);
                            if (unlockedBuilding) turnMessages.push(`Здание: ${unlockedBuilding.name} доступно.`);
                        });
                        newState.currentResearch = null;
                        const newlyAvailableTechs = newState.technologies.filter(tech =>
                            !tech.researched &&
                            (!newState.currentResearch || tech.id !== newState.currentResearch.id) &&
                            (tech.prerequisites || []).every(prereqId =>
                                newState.technologies.find(t => t.id === prereqId)?.researched
                            )
                        );
                        if (newlyAvailableTechs.length > 0) {
                            turnMessages.push(`Стали доступны для исследования: ${newlyAvailableTechs.map(t => t.name).join(', ')}.`);
                        }
                    } else {
                        newState.currentResearch = { ...newState.currentResearch, progress: currentResearchProgress };
                    }
                } else if (researchDetails && researchDetails.researched ) {
                    newState.currentResearch = null;
                } else if (!researchDetails && newState.currentResearch) {
                    console.error("Текущее исследование не найдено в списке технологий:", newState.currentResearch.id);
                    newState.currentResearch = null;
                }
            } else if (newState.currentResearch && totalPlayerScienceOutput <= 0 && newState.gold >=0) {
                turnMessages.push(`Нет притока науки для исследования ${newState.currentResearch.name}.`);
            } else if (newState.currentResearch && newState.gold < 0) {
                turnMessages.push(`Исследование ${newState.currentResearch.name} остановлено из-за нехватки средств.`);
            }

            newState = handleAITurn(newState);
            newState.currentTurn += 1;
            newState.gameMessages = [...prev.gameMessages, ...turnMessages, `--- Начинается ход ${newState.currentTurn} ---`].slice(-50);

            // Проверяем условия победы
            const victoryCheck = checkVictoryConditions(newState);
            if (victoryCheck.gameOver) {
                newState.gameOver = true;
                newState.victoryType = victoryCheck.victoryType;
                const victoryMessage = victoryCheck.victoryType === 'science'
                    ? 'Поздравляем! Достигнута научная победа!'
                    : 'Поздравляем! Достигнута военная победа!';

                newState.gameMessages = [...newState.gameMessages, victoryMessage];
            }

            return newState;
        });
    };

    const handleAITurn = (currentState) => {
        let stateCopy = JSON.parse(JSON.stringify(currentState));
        let currentUnits = [...stateCopy.units];
        const playerUnits = currentUnits.filter(unit => unit.owner === 'player');
        const aiPlayersInGame = stateCopy.aiPlayers || [];

        // Управление ИИ игроками
        aiPlayersInGame.forEach(aiOwner => {
            const unitsOfThisAI = currentUnits.filter(unit => unit.owner === aiOwner && unit.id);
            const citiesOfThisAI = stateCopy.cities.filter(city => city.owner === aiOwner);

            // Логика строительства для городов ИИ
            citiesOfThisAI.forEach(city => {
                // Если нет очереди строительства, создаем новую
                if (!city.productionQueue) {
                    // Простая логика: строить юнитов с 70% вероятностью, здания - с 30%
                    const shouldBuildUnit = Math.random() < 0.7;

                    if (shouldBuildUnit) {
                        // Список доступных юнитов
                        const availableUnits = Object.values(UNIT_TYPES).filter(unit =>
                            !unit.requiresTech || currentState.technologies.find(tech =>
                                tech.id === unit.requiresTech && tech.researched)
                        );

                        if (availableUnits.length > 0) {
                            // Выбираем случайный юнит
                            const unitToBuild = availableUnits[Math.floor(Math.random() * availableUnits.length)];
                            city.productionQueue = {
                                type: 'unit',
                                id: unitToBuild.id,
                                name: unitToBuild.type,
                                cost: unitToBuild.productionCost,
                                progress: 0
                            };
                        }
                    } else {
                        // Список доступных зданий
                        const availableBuildings = Object.values(BUILDING_TYPES).filter(building =>
                            !building.requiresTech || currentState.technologies.find(tech =>
                                tech.id === building.requiresTech && tech.researched)
                        );

                        // Отфильтровываем здания, которые уже построены
                        const buildableBuildings = availableBuildings.filter(building =>
                            !city.buildings.some(b => b.id === building.id)
                        );

                        if (buildableBuildings.length > 0) {
                            // Выбираем случайное здание
                            const buildingToBuild = buildableBuildings[Math.floor(Math.random() * buildableBuildings.length)];
                            city.productionQueue = {
                                type: 'building',
                                id: buildingToBuild.id,
                                name: buildingToBuild.name,
                                cost: buildingToBuild.productionCost,
                                progress: 0
                            };
                        }
                    }
                }

                // Прогресс строительства
                if (city.productionQueue) {
                    const cityProductions = calculateCityProduction(city, stateCopy.map, BUILDING_TYPES, UNIT_TYPES);
                    const productionThisTurn = cityProductions.productionYield || 1;
                    city.productionQueue.progress += productionThisTurn;

                    // Завершаем строительство, если достигнут порог
                    if (city.productionQueue.progress >= city.productionQueue.cost) {
                        if (city.productionQueue.type === 'unit') {
                            const unitData = UNIT_TYPES[city.productionQueue.id];
                            if (unitData) {
                                currentUnits.push({
                                    ...unitData,
                                    id: `unit_ai_${aiOwner}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                                    x: city.x,
                                    y: city.y,
                                    health: unitData.maxHealth,
                                    movesLeft: unitData.maxMoves,
                                    hasAttacked: false,
                                    owner: aiOwner
                                });
                            }
                        } else if (city.productionQueue.type === 'building') {
                            const buildingData = BUILDING_TYPES[city.productionQueue.id];
                            if (buildingData) {
                                city.buildings.push({ ...buildingData });
                            }
                        }
                        city.productionQueue = null;
                    }
                }
            });

            // Логика передвижения юнитов ИИ
            unitsOfThisAI.forEach(aiUnitOriginal => {
                const unitTypeDataAI = UNIT_TYPES[aiUnitOriginal.id_type || aiUnitOriginal.id] || Object.values(UNIT_TYPES).find(ut => ut.type === aiUnitOriginal.type);
                let aiUnit = { ...aiUnitOriginal, movesLeft: unitTypeDataAI?.maxMoves || DEFAULT_UNIT_MOVES, hasAttacked: false };
                let actionTakenThisTurn = false;

                // Поиск ближайших юнитов игрока для атаки
                const nearbyPlayerUnits = playerUnits
                    .filter(pUnit => calculateDistance(aiUnit.x, aiUnit.y, pUnit.x, pUnit.y) <= (aiUnit.attackRange || 1) + 4)
                    .sort((a, b) => (a.health / a.maxHealth) - (b.health / b.maxHealth));

                if (nearbyPlayerUnits.length > 0 && (Math.random() > 0.2) && !aiUnit.hasAttacked) {
                    const targetUnit = nearbyPlayerUnits[0];
                    if(calculateDistance(aiUnit.x, aiUnit.y, targetUnit.x, targetUnit.y) <= (aiUnit.attackRange || 1) && canAttackTarget(aiUnit, targetUnit, stateCopy.map)){
                        const damage = Math.max(1, (aiUnit.attack || 0) - (targetUnit.defense || 0) / 2 + (Math.floor(Math.random()*3)-1));
                        const targetIdx = currentUnits.findIndex(u => u.id === targetUnit.id);
                        if(targetIdx !== -1){
                            currentUnits[targetIdx].health -= damage;
                            stateCopy.gameMessages.push(`ИИ (${aiOwner}) ${aiUnit.type} атаковал ${targetUnit.type} на ${damage}!`);
                            if(currentUnits[targetIdx].health <= 0) {
                                stateCopy.gameMessages.push(`Ваш ${targetUnit.type} был уничтожен ИИ (${aiOwner})!`);
                                currentUnits.splice(targetIdx, 1);
                            }
                        }
                        aiUnit.hasAttacked = true;
                        aiUnit.movesLeft = 0;
                        actionTakenThisTurn = true;
                    }
                }

                // Если юнит не атаковал, перемещаем его
                if (!actionTakenThisTurn && aiUnit.movesLeft > 0) {
                    let moved = false;
                    if (nearbyPlayerUnits.length > 0) {
                        const target = nearbyPlayerUnits[0];
                        const dx = Math.sign(target.x - aiUnit.x);
                        const dy = Math.sign(target.y - aiUnit.y);
                        let potentialNewX = aiUnit.x + dx;
                        let potentialNewY = aiUnit.y + dy;
                        if (dx !== 0 && dy !== 0) {
                            if(Math.random() < 0.5){
                                if(canUnitMoveTo(aiUnit, aiUnit.x + dx, aiUnit.y, stateCopy.map, currentUnits)) {aiUnit.x += dx; moved = true;}
                                else if(canUnitMoveTo(aiUnit, aiUnit.x, aiUnit.y + dy, stateCopy.map, currentUnits)) {aiUnit.y += dy; moved = true;}
                            } else {
                                if(canUnitMoveTo(aiUnit, aiUnit.x, aiUnit.y + dy, stateCopy.map, currentUnits)) {aiUnit.y += dy; moved = true;}
                                else if(canUnitMoveTo(aiUnit, aiUnit.x + dx, aiUnit.y, stateCopy.map, currentUnits)) {aiUnit.x += dx; moved = true;}
                            }
                        } else if (dx !== 0 && canUnitMoveTo(aiUnit, potentialNewX, aiUnit.y, stateCopy.map, currentUnits)) {
                            aiUnit.x = potentialNewX; moved = true;
                        } else if (dy !== 0 && canUnitMoveTo(aiUnit, aiUnit.x, potentialNewY, stateCopy.map, currentUnits)) {
                            aiUnit.y = potentialNewY; moved = true;
                        }
                        if(moved) aiUnit.movesLeft--;
                    }
                    if (!moved && aiUnit.movesLeft > 0) {
                        const possibleRandomMoves = getMovableTiles(aiUnit, stateCopy.map, currentUnits);
                        if (possibleRandomMoves.length > 0) {
                            const randomMove = possibleRandomMoves[Math.floor(Math.random() * possibleRandomMoves.length)];
                            const dist = calculateDistance(aiUnit.x, aiUnit.y, randomMove.x, randomMove.y);
                            aiUnit.x = randomMove.x;
                            aiUnit.y = randomMove.y;
                            aiUnit.movesLeft = Math.max(0, aiUnit.movesLeft - dist);
                        }
                    }
                }
                const unitIdxToUpdate = currentUnits.findIndex(u => u.id === aiUnitOriginal.id);
                if(unitIdxToUpdate !== -1) currentUnits[unitIdxToUpdate] = aiUnit;
            });
        });

        // Логика для варваров остается без изменений
        const barbarianUnits = currentUnits.filter(unit => unit.owner === 'barbarians' && unit.id);
        barbarianUnits.forEach(barbOriginal => {
            let barbarian = { ...barbOriginal, movesLeft: UNIT_TYPES[barbOriginal.id_type || barbOriginal.id]?.maxMoves || DEFAULT_UNIT_MOVES, hasAttacked: false };
            const nearbyPlayerUnitsForBarb = playerUnits
                .filter(pUnit => calculateDistance(barbarian.x, barbarian.y, pUnit.x, pUnit.y) <= (barbarian.attackRange || 1) + 3)
                .sort((a,b) => (a.health / a.maxHealth) - (b.health / b.maxHealth));
            let barbActionTaken = false;
            if (nearbyPlayerUnitsForBarb.length > 0 && !barbarian.hasAttacked && Math.random() > 0.3) {
                const targetUnit = nearbyPlayerUnitsForBarb[0];
                if(calculateDistance(barbarian.x, barbarian.y, targetUnit.x, targetUnit.y) <= (barbarian.attackRange||1) && canAttackTarget(barbarian, targetUnit, stateCopy.map)){
                    const damage = Math.max(1, (barbarian.attack || 0) - (targetUnit.defense || 0) / 2 + (Math.floor(Math.random()*2)));
                    const targetIdx = currentUnits.findIndex(u => u.id === targetUnit.id);
                    if(targetIdx !== -1){
                        currentUnits[targetIdx].health -= damage;
                        stateCopy.gameMessages.push(`Варвары (${barbarian.type}) атаковали ${targetUnit.type} нанеся ${damage}!`);
                        if(currentUnits[targetIdx].health <= 0) {
                            stateCopy.gameMessages.push(`Ваш ${targetUnit.type} был уничтожен варварами!`);
                            currentUnits.splice(targetIdx, 1);
                        }
                    }
                    barbarian.hasAttacked = true;
                    barbarian.movesLeft = 0;
                    barbActionTaken = true;
                }
            }
            if(!barbActionTaken && barbarian.movesLeft > 0) {
                let movedBarb = false;
                if (nearbyPlayerUnitsForBarb.length > 0) {
                    const target =nearbyPlayerUnitsForBarb[0];
                    const dx = Math.sign(target.x - barbarian.x);
                    const dy = Math.sign(target.y - barbarian.y);
                    if (dx !== 0 && canUnitMoveTo(barbarian, barbarian.x + dx, barbarian.y, stateCopy.map, currentUnits)) {
                        barbarian.x += dx; barbarian.movesLeft--; movedBarb = true;
                    } else if (dy !== 0 && canUnitMoveTo(barbarian, barbarian.x, barbarian.y + dy, stateCopy.map, currentUnits)) {
                        barbarian.y += dy; barbarian.movesLeft--; movedBarb = true;
                    }
                }
                if (!movedBarb && barbarian.movesLeft > 0) {
                    const possibleRandomMoves = getMovableTiles(barbarian, stateCopy.map, currentUnits);
                    if (possibleRandomMoves.length > 0) {
                        const randomMove = possibleRandomMoves[Math.floor(Math.random() * possibleRandomMoves.length)];
                        barbarian.x = randomMove.x;
                        barbarian.y = randomMove.y;
                        barbarian.movesLeft = Math.max(0, barbarian.movesLeft - calculateDistance(barbOriginal.x,barbOriginal.y, randomMove.x, randomMove.y));
                    }
                }
            }
            const barbIdxOriginal = currentUnits.findIndex(u => u.id === barbOriginal.id);
            if (barbIdxOriginal !== -1) currentUnits[barbIdxOriginal] = barbarian;
        });
        stateCopy.units = currentUnits;
        return stateCopy;
    };

    const handleMoveUnit = (unitId) => {
        setGameState(prev => {
            const unit = prev.units.find(u => u.id === unitId);
            if (!unit || unit.owner !== 'player' || unit.movesLeft <= 0) {
                return { ...prev, gameMessages: [...prev.gameMessages, "Юнит не может двигаться."] };
            }
            const possibleMoves = getMovableTiles(unit, prev.map, prev.units);
            if (!possibleMoves || possibleMoves.length === 0) {
                return { ...prev, gameMessages: [...prev.gameMessages, "Нет доступных ходов."] };
            }
            return {
                ...prev,
                selectedUnitId: unitId,
                movingUnit: unitId,
                attackingUnit: null,
                possibleMoves,
                gameMessages: [...prev.gameMessages, `Юнит '${unit.type}' (${unit.movesLeft} ходов): выберите куда идти.`]
            };
        });
    };

    const handleAttackUnit = (attackerId) => {
        setGameState(prev => {
            const attacker = prev.units.find(u => u.id === attackerId);
            if (!attacker || attacker.owner !== 'player' || attacker.movesLeft <= 0 || attacker.hasAttacked) {
                return { ...prev, gameMessages: [...prev.gameMessages, "Этот юнит не может атаковать."] };
            }

            const attackRange = attacker.attackRange || 1;
            let possibleTargets = [];

            // Находим все юниты И города в радиусе атаки
            prev.units.forEach(potentialTarget => {
                if (potentialTarget.owner !== attacker.owner && potentialTarget.id !== attacker.id) {
                    if (calculateDistance(attacker.x, attacker.y, potentialTarget.x, potentialTarget.y) <= attackRange) {
                        if (canAttackTarget(attacker, potentialTarget, prev.map)) {
                            possibleTargets.push({ x: potentialTarget.x, y: potentialTarget.y, unitId: potentialTarget.id, type: 'unit' });
                        }
                    }
                }
            });

            prev.cities.forEach(potentialTarget => {
                if (potentialTarget.owner !== attacker.owner) {
                    if (calculateDistance(attacker.x, attacker.y, potentialTarget.x, potentialTarget.y) <= attackRange) {
                        possibleTargets.push({x: potentialTarget.x, y: potentialTarget.y, cityId: potentialTarget.id, type: 'city'})
                    }
                }
            })

            if (possibleTargets.length === 0) {
                return { ...prev, gameMessages: [...prev.gameMessages, "Нет доступных целей для атаки."] };
            }

            return {
                ...prev,
                selectedUnitId: attackerId,
                attackingUnit: attackerId,
                movingUnit: null,
                possibleMoves: possibleTargets, // possibleMoves теперь содержит цели для атаки
                gameMessages: [...prev.gameMessages, `Юнит '${attacker.type}': выберите цель.`]
            };
        });
    };

    const handleTileClick = (x, y) => {
        setGameState(prev => {
            const clickedTile = prev.map[y]?.[x];
            if (!clickedTile || !clickedTile.discovered) return prev;

            let newState = JSON.parse(JSON.stringify(prev)); // Создаем глубокую копию состояния
            newState.selectedTile = { x, y };

            if (newState.movingUnit) {
                const unitToMoveIdx = newState.units.findIndex(u => u.id === newState.movingUnit);

                if (unitToMoveIdx !== -1) { // Проверяем, найден ли юнит
                    const unitToMove = newState.units[unitToMoveIdx];
                    const isValidMoveTarget = newState.possibleMoves.some(m => m.x === x && m.y === y); // Проверяем допустимость хода

                    if (isValidMoveTarget && canUnitMoveTo(unitToMove, x, y, newState.map, newState.units)) {
                        const distance = calculateDistance(unitToMove.x, unitToMove.y, x, y);

                        newState.units[unitToMoveIdx].x = x; // Обновляем координаты юнита
                        newState.units[unitToMoveIdx].y = y;
                        newState.units[unitToMoveIdx].movesLeft = Math.max(0, unitToMove.movesLeft - distance); // Обновляем оставшиеся ходы

                        revealMapAround(newState.map, x, y, 2); // Открываем клетки вокруг юнита


                        newState.gameMessages.push(`${newState.units[unitToMoveIdx].type} переместился. Ходов: ${newState.units[unitToMoveIdx].movesLeft}.`);

                        // Если у юнита остались ходы, обновляем possibleMoves
                        if (newState.units[unitToMoveIdx].movesLeft > 0) {
                            newState.possibleMoves = getMovableTiles(newState.units[unitToMoveIdx], newState.map, newState.units); // Пересчитываем доступные ходы
                            newState.selectedUnitId = newState.units[unitToMoveIdx].id; // Выбранный юнит остается выбранным - важно для продолжения движения
                        } else {
                            newState.movingUnit = null; // Сбрасываем состояние движения
                            newState.possibleMoves = []; // Очищаем доступные ходы
                            newState.selectedUnitId = newState.units[unitToMoveIdx].id; // Юнит остается выбранным, но больше не двигается
                        }

                    } else {
                        newState.gameMessages.push("Невозможно переместиться на эту клетку.");
                        newState.movingUnit = null; // Сбрасываем состояние движения, если ход неверный
                        newState.possibleMoves = [];
                    }

                } else {
                    newState.gameMessages.push("Не найден юнит для перемещения!");
                    newState.movingUnit = null;
                    newState.possibleMoves = [];
                }
            } else if (newState.attackingUnit) {
                const attackerIdx = newState.units.findIndex(u => u.id === newState.attackingUnit);
                if (attackerIdx !== -1) {
                    const attacker = newState.units[attackerIdx];
                    const isValidAttack = newState.possibleMoves.some(m => m.x === x && m.y === y);

                    if (isValidAttack) {
                        const target = newState.possibleMoves.find(m => m.x === x && m.y === y);

                        if (target.type === 'unit') {
                            let targetUnitIdx = newState.units.findIndex(u => u.x === x && u.y === y && u.owner !== attacker.owner);
                            if (targetUnitIdx !== -1) {
                                let targetOnTile = newState.units[targetUnitIdx];

                                const damage = Math.max(1, (attacker.attack || 0) - (targetOnTile.defense || 0) / 2 + (Math.floor(Math.random() * 3) - 1));
                                newState.units[targetUnitIdx].health -= damage;
                                newState.units[attackerIdx].hasAttacked = true;
                                newState.units[attackerIdx].movesLeft = 0;
                                newState.gameMessages.push(`Ваш ${attacker.type} атаковал ${targetOnTile.owner === 'barbarians' ? 'варварского' : 'вражеского'} ${targetOnTile.type}, нанеся ${damage} урона.`);
                                if (newState.units[targetUnitIdx].health <= 0) {
                                    newState.gameMessages.push(`${targetOnTile.owner === 'barbarians' ? 'Варварский' : 'Вражеский'} ${targetOnTile.type} уничтожен!`);
                                    newState.units.splice(targetUnitIdx, 1);
                                }
                                newState.selectedUnitId = attacker.id;
                            }
                        } else {
                            const cityTarget = newState.cities.find(c => c.x === x && c.y === y && c.owner !== attacker.owner);
                            if (cityTarget) {
                                const damage = Math.max(1, (attacker.attack || 0) - (cityTarget.defense || 0) / 2 + (Math.floor(Math.random() * 3) - 1));
                                const cityIndex = newState.cities.findIndex(c => c.id === cityTarget.id);

                                if (cityIndex !== -1) {
                                    newState.cities[cityIndex].health -= damage;
                                    newState.units[attackerIdx].hasAttacked = true;
                                    newState.units[attackerIdx].movesLeft = 0;
                                    newState.gameMessages.push(`Ваш ${attacker.type} атаковал город ${cityTarget.name}, нанеся ${damage} урона.`);

                                    if (newState.cities[cityIndex].health <= 0) {
                                        newState.cities[cityIndex].owner = attacker.owner;
                                        newState.cities[cityIndex].health = newState.cities[cityIndex].maxHealth / 2;
                                        newState.cities[cityIndex].population = Math.max(1, Math.floor(newState.cities[cityIndex].population * 0.7));
                                        newState.gameMessages.push(`Город ${cityTarget.name} захвачен!`);

                                        const victoryCheck = checkVictoryConditions(newState);
                                        if (victoryCheck.gameOver) {
                                            newState.gameOver = true;
                                            newState.victoryType = victoryCheck.victoryType;
                                            const victoryMessage = victoryCheck.victoryType === 'science'
                                                ? 'Поздравляем! Достигнута научная победа!'
                                                : 'Поздравляем! Достигнута военная победа!';
                                            newState.gameMessages = [...newState.gameMessages, victoryMessage];
                                        }
                                    }
                                    newState.selectedUnitId = attacker.id;
                                }
                            }
                        }

                    } else {
                        newState.gameMessages.push("Недопустимая цель для атаки.");
                    }
                }

                newState.attackingUnit = null;
                newState.possibleMoves = [];
            } else {
                const unitOnTile = newState.units.find(u => u.x === x && u.y === y);
                const cityOnTile = newState.cities.find(c => c.x === x && c.y === y);
                if (unitOnTile) {
                    newState.selectedUnitId = unitOnTile.id;
                    newState.selectedCityId = null;
                    newState.gameMessages.push(`Выбран ${unitOnTile.owner === 'player' ? 'ваш' : unitOnTile.owner} юнит: ${unitOnTile.type}.`);
                } else if (cityOnTile) {
                    if (cityOnTile.owner === 'player') {
                        newState.selectedCityId = cityOnTile.id;
                        newState.selectedUnitId = null;
                        newState.gameMessages.push(`Выбран ваш город: ${cityOnTile.name}.`);
                    } else {
                        newState.selectedCityId = null;
                        newState.selectedUnitId = null;
                        newState.gameMessages.push(`Вражеский город: ${cityOnTile.name} (${cityOnTile.owner}).`);
                    }
                } else {
                    newState.selectedUnitId = null;
                    newState.selectedCityId = null;
                    newState.gameMessages.push(`Выбрана клетка (${x}, ${y}).`);
                }
                newState.possibleMoves = [];
            }
            return newState;
        });
    };

    const handleBuildCity = (settlerId) => {
        setGameState(prev => {
            const settler = prev.units.find(u => u.id === settlerId && u.type === 'Поселенец' && u.owner === 'player');
            if (!settler) return { ...prev, gameMessages: [...prev.gameMessages, "Выберите вашего Поселенца."] };
            const {x: tileX, y: tileY} = settler;
            if (prev.cities.some(c => calculateDistance(c.x, c.y, tileX, tileY) < 3)) return { ...prev, gameMessages: [...prev.gameMessages, "Слишком близко к другому городу."] };
            const tile = prev.map[tileY]?.[tileX];
            if (!tile || tile.type === 'water' || tile.type === 'mountain') return { ...prev, gameMessages: [...prev.gameMessages, "Нельзя основать город здесь."] };

            // Выбор имени из пользовательского списка
            const usedNames = prev.cities.filter(c => c.owner === 'player').map(c => c.name);
            const availableNames = CUSTOM_CITY_NAMES.filter(name => !usedNames.includes(name));
            let newCityName = availableNames.length > 0
                ? availableNames[0]
                : `Город #${prev.cities.filter(c=>c.owner === 'player').length + 1}`;

            const isCoastal = getAdjacentTiles(tileX, tileY, prev.map).some(n => n?.type === 'water');
            const newCityWorkableTiles = getWorkableTilesForCityLocal(tileX, tileY, prev.map);
            let newCityWorkingTiles = [];
            if (newCityWorkableTiles.length > 0 ) {
                const sortedWorkable = [...newCityWorkableTiles].sort((a,b)=>( (prev.map[b.y]?.[b.x]?.food || 0) + (prev.map[b.y]?.[b.x]?.production || 0) * 0.7) - ( (prev.map[a.y]?.[a.x]?.food || 0) + (prev.map[a.y]?.[a.x]?.production || 0) * 0.7));
                if(sortedWorkable.length > 0) newCityWorkingTiles.push({x: sortedWorkable[0].x, y: sortedWorkable[0].y});
            }

            const initialCityData = {
                id: `city_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                name: newCityName, owner: 'player', x: tileX, y: tileY, population: 1,
                buildings: [], workingTiles: newCityWorkingTiles, workableTiles: newCityWorkableTiles,
                coastal: isCoastal,
            };
            const initialCityProduction = calculateCityProduction(initialCityData, prev.map, BUILDING_TYPES, UNIT_TYPES);
            const newCity = {
                ...initialCityData,
                ...initialCityProduction,
                defense: 5, productionQueue: null, health: 100, maxHealth: 100,
            };

            const newMap = [...prev.map];
            revealMapAround(newMap, tileX, tileY, 3);

            const newCityGrowthProgress = { ...prev.cityGrowthProgress, [newCity.id]: 0 };

            return {
                ...prev, map: newMap, units: prev.units.filter(u => u.id !== settlerId), cities: [...prev.cities, newCity],
                selectedCityId: newCity.id, selectedUnitId: null, movingUnit: null, attackingUnit: null, possibleMoves: [],
                cityGrowthProgress: newCityGrowthProgress,
                gameMessages: [...prev.gameMessages, `Основан новый город: ${newCityName}!`]
            };
        });
    };

    const handleBuildUnit = (cityId, unitTypeId) => {
        setGameState(prev => {
            const city = prev.cities.find(c => c.id === cityId && c.owner === 'player');
            const unitData = UNIT_TYPES[unitTypeId];
            if (!city || !unitData) return {...prev, gameMessages: [...prev.gameMessages, "Ошибка: Город или тип юнита не найден."]};
            if (city.productionQueue) return {...prev, gameMessages: [...prev.gameMessages, `Производство в г. ${city.name} уже занято.`]};
            const techNeeded = unitData.requiresTech;
            if (techNeeded && !prev.technologies.find(t => t.id === techNeeded && t.researched)) {
                const techName = TECHNOLOGIES_DATA.find(t => t.id === techNeeded)?.name || techNeeded;
                return {...prev, gameMessages: [...prev.gameMessages, `Для постройки "${unitData.type}" нужна технология "${techName}".`]};
            }
            if (unitData.naval && !city.coastal) {
                return { ...prev, gameMessages: [...prev.gameMessages, "Морские юниты можно строить только в прибрежных городах."] };
            }
            const cityProdRate = city.productionYield > 0 ? city.productionYield : 1;
            const turns = Math.ceil(unitData.productionCost / cityProdRate);
            const updatedCities = prev.cities.map(c =>
                c.id === cityId ? { ...c, productionQueue: { type: 'unit', id: unitTypeId, name: unitData.type, cost: unitData.productionCost, progress: 0 } } : c
            );
            return { ...prev, cities: updatedCities, gameMessages:[...prev.gameMessages, `В г. ${city.name} начато производство ${unitData.type} (${turns} ходов).`] };
        });
    };

    const handleBuildBuilding = (cityId, buildingTypeId) => {
        setGameState(prev => {
            const city = prev.cities.find(c => c.id === cityId && c.owner === 'player');
            const buildingData = BUILDING_TYPES[buildingTypeId];
            if (!city || !buildingData) return {...prev, gameMessages: [...prev.gameMessages, "Ошибка: Город или тип здания не найден."]};;
            if (city.productionQueue) return {...prev, gameMessages: [...prev.gameMessages, `Производство в г. ${city.name} уже занято.`]};
            if ((city.buildings || []).some(b => b.id === buildingTypeId)) {
                return {...prev, gameMessages: [...prev.gameMessages, `Здание ${buildingData.name} уже построено в г. ${city.name}.`]};
            }
            const techNeeded = buildingData.requiresTech;
            if (techNeeded && !prev.technologies.find(t => t.id === techNeeded && t.researched)) {
                const techName = TECHNOLOGIES_DATA.find(t => t.id === techNeeded)?.name || techNeeded;
                return {...prev, gameMessages: [...prev.gameMessages, `Для постройки "${buildingData.name}" нужна технология "${techName}".`]};
            }
            if (buildingTypeId === 'HARBOR' && !city.coastal) {
                return { ...prev, gameMessages: [...prev.gameMessages, "Гавань можно построить только в прибрежном городе."] };
            }
            const cityProdRate = city.productionYield > 0 ? city.productionYield : 1;
            const turns = Math.ceil(buildingData.productionCost / cityProdRate);
            const updatedCities = prev.cities.map(c =>
                c.id === cityId ? { ...c, productionQueue: { type: 'building', id: buildingTypeId, name: buildingData.name, cost: buildingData.productionCost, progress: 0 } } : c
            );
            return { ...prev, cities: updatedCities, gameMessages:[...prev.gameMessages, `В г. ${city.name} начато строительство ${buildingData.name} (${turns} ходов).`] };
        });
    };

    const handleCancelProduction = (cityId) => {
        setGameState(prev => {
            const city = prev.cities.find(c => c.id === cityId);
            if (!city) return prev;
            return {
                ...prev,
                cities: prev.cities.map(c => c.id === cityId ? { ...c, productionQueue: null } : c),
                gameMessages: [...prev.gameMessages, `Производство в городе ${city.name} отменено.`]
            };
        });
    };

    const handleHarvestResource = (unitId) => {
        setGameState(prev => {
            const unit = prev.units.find(u => u.id === unitId && u.type === 'Рыбацкая лодка' && u.owner === 'player');
            if (!unit) return { ...prev, gameMessages: [...prev.gameMessages, "Действие недоступно этому юниту."]};
            const tile = prev.map[unit.y]?.[unit.x];
            if (!tile?.resource || tile.type !== 'water') return { ...prev, gameMessages: [...prev.gameMessages, "Здесь нет водного ресурса для сбора."]};

            let gainAmount = 0, gainType = '', newGoldVal = prev.gold;
            if (tile.resource === 'fish') {
                gainAmount = 20 + Math.floor(Math.random() * 11);
                gainType = 'золота (за рыбу)';
                newGoldVal += gainAmount;
            } else if (tile.resource === 'spices' && tile.type === 'water') { // Пример если пряности на воде
                gainAmount = 30 + Math.floor(Math.random() * 21);
                gainType = 'золота (за пряности)';
                newGoldVal += gainAmount;
            }

            if (gainAmount === 0) return { ...prev, gameMessages: [...prev.gameMessages, "Не удалось собрать ресурс (тип не определен или не водный)."]};
            const updatedMap = prev.map.map((r, y) => r.map((t, x) => (x === unit.x && y === unit.y ? { ...t, resource: null } : t)));
            return {
                ...prev,
                units: prev.units.filter(u => u.id !== unitId),
                gold: newGoldVal,
                map: updatedMap,
                gameMessages: [...prev.gameMessages, `Рыбацкая лодка добыла ${gainType}.`]
            };
        });
    };

    const handleToggleWorker = (cityId, tileX, tileY) => {
        setGameState(prev => {
            const cityIndex = prev.cities.findIndex(c => c.id === cityId && c.owner === 'player');
            if (cityIndex === -1) return prev;

            let city = JSON.parse(JSON.stringify(prev.cities[cityIndex]));
            city.workingTiles = city.workingTiles || [];

            const workerIndex = city.workingTiles.findIndex(t => t.x === tileX && t.y === tileY);

            if (workerIndex >= 0) {
                city.workingTiles.splice(workerIndex, 1);
            } else {
                if ((city.workingTiles.length || 0) >= (city.population || 1)) {
                    return { ...prev, gameMessages: [...prev.gameMessages, `В г. ${city.name} нет свободных жителей.`] };
                }
                const tileOnMap = prev.map[tileY]?.[tileX];
                const isWorkableByCity = city.workableTiles?.some(wt => wt.x === tileX && wt.y === tileY);

                if (!tileOnMap || tileOnMap.type === 'mountain' || !isWorkableByCity) {
                    return { ...prev, gameMessages: [...prev.gameMessages, `Нельзя работать на этой клетке или она не принадлежит городу.`] };
                }
                city.workingTiles.push({ x: tileX, y: tileY });
            }

            const newCityProductions = calculateCityProduction(city, prev.map, BUILDING_TYPES, UNIT_TYPES);
            city = {...city, ...newCityProductions};

            const updatedCities = [...prev.cities];
            updatedCities[cityIndex] = city;

            return { ...prev, cities: updatedCities, gameMessages: [...prev.gameMessages, `Рабочие в г. ${city.name} обновлены.`] };
        });
    };

    const handleOpenTechTreeForUI = () => {
        setShowCivilopediaModal(false);
        setShowTechTreeModal(true);
    };

    const handleViewCivilopediaFromUI = (entryData = null, isOpen = true) => {
        if (isOpen) {
            setShowTechTreeModal(false);
            setCivilopediaInitialEntry(entryData);
            setShowCivilopediaModal(true);
        } else {
            setShowCivilopediaModal(false);
            setCivilopediaInitialEntry(null);
        }
    };

    const handleSelectResearch = (techToResearch) => {
        setGameState(prev => {
            if (!techToResearch || techToResearch.researched || (prev.currentResearch && prev.currentResearch.id === techToResearch.id)) return prev;
            const prereqsMet = (techToResearch.prerequisites || []).every(prereqId =>
                prev.technologies.find(t => t.id === prereqId)?.researched
            );
            if (!prereqsMet) {
                const missing = (techToResearch.prerequisites || []).filter(id => !prev.technologies.find(t => t.id === id)?.researched).map(id => TECHNOLOGIES_DATA.find(t=>t.id===id)?.name||id);
                return { ...prev, gameMessages: [...prev.gameMessages, `Для "${techToResearch.name}" не исследованы: ${missing.join(', ')}.`] };
            }
            return {
                ...prev,
                currentResearch: { id: techToResearch.id, name: techToResearch.name, cost: techToResearch.cost, progress: 0 },
                gameMessages: [...prev.gameMessages, `Начато исследование: ${techToResearch.name}.`]
            };
        });
        setShowTechTreeModal(false);
    };

    const handleCancelResearch = () => {
        setGameState(prev => ({ ...prev, currentResearch: null, gameMessages: [...prev.gameMessages, `Исследование отменено.`] }));
    };

    const handleMoveViewport = ({ x, y }) => {
        setGameState(prev => ({ ...prev, viewportPosition: { x: Math.round(x), y: Math.round(y) } }));
    };

    const handleCitySelectFromUI = (cityId) => {
        setGameState(prev => ({ ...prev, selectedCityId: cityId, selectedUnitId: null, movingUnit: null, attackingUnit: null, possibleMoves: [] }));
    };

    const handleUnitSelectFromUI = (unitId) => {
        setGameState(prev => ({ ...prev, selectedUnitId: unitId, selectedCityId: null, movingUnit: null, attackingUnit: null, possibleMoves: [] }));
    };

    // Обработчики для переименования городов
    const handleRenameCity = (cityId, newName) => {
        if (!newName || newName.trim() === '') return;

        setGameState(prev => {
            const updatedCities = prev.cities.map(city =>
                city.id === cityId ? { ...city, name: newName.trim() } : city
            );

            return {
                ...prev,
                cities: updatedCities,
                renamingCityId: null,
                customCityName: "",
                gameMessages: [...prev.gameMessages, `Город переименован в "${newName.trim()}".`]
            };
        });
    };

    // Функция для открытия диалога переименования
    const handleStartRenameCity = (cityId) => {
        const city = gameState.cities.find(c => c.id === cityId);
        if (city) {
            setGameState(prev => ({
                ...prev,
                renamingCityId: cityId,
                customCityName: city.name
            }));
        }
    };

    // Функция для отмены переименования
    const handleCancelRenameCity = () => {
        setGameState(prev => ({
            ...prev,
            renamingCityId: null,
            customCityName: ""
        }));
    };

    // Обработчик для обновления поля ввода
    const handleCustomNameChange = (e) => {
        setGameState(prev => ({
            ...prev,
            customCityName: e.target.value
        }));
    };

    return (
        <>
            {showMenu ? (
                <MainMenu
                    onStartNewGame={startNewGame}
                    onLoadGame={handleLoadGame}
                />
            ) : (
                <div className="h-screen w-screen overflow-hidden bg-black relative flex flex-col">
                    <GameMap
                        gameState={gameState}
                        onTileClick={handleTileClick}
                        onMoveViewport={handleMoveViewport}
                    />
                    <GameUI
                        gameState={gameState}
                        unitTypes={UNIT_TYPES}
                        buildingTypes={BUILDING_TYPES}
                        baseFoodForGrowth={BASE_FOOD_FOR_GROWTH}
                        growthFactor={GROWTH_FACTOR}
                        onEndTurn={handleEndTurn}
                        onFoundCity={handleBuildCity}
                        onBuildUnit={handleBuildUnit}
                        onBuildBuilding={handleBuildBuilding}
                        onMoveUnit={handleMoveUnit}
                        onAttackUnit={handleAttackUnit}
                        onToggleWorker={handleToggleWorker}
                        onCancelProduction={handleCancelProduction}
                        onSelectResearch={handleSelectResearch}
                        onCancelResearch={handleCancelResearch}
                        onViewCivilopedia={handleViewCivilopediaFromUI}
                        onCitySelect={handleCitySelectFromUI}
                        onUnitSelect={handleUnitSelectFromUI}
                        onOpenTechTree={handleOpenTechTreeForUI}
                        onHarvestResource={handleHarvestResource}
                        onSaveGame={handleSaveGame}
                        onExitToMenu={handleExitToMenu}
                        onStartRenameCity={handleStartRenameCity}
                        onCityNameChange={handleCustomNameChange}
                        onConfirmRenameCity={handleRenameCity}
                        onCancelRenameCity={handleCancelRenameCity}
                        isTechTreeModalOpen={showTechTreeModal}
                        isCivilopediaModalOpen={showCivilopediaModal}
                    />
                    {showTechTreeModal && (
                        <TechTree
                            technologies={gameState.technologies}
                            currentResearch={gameState.currentResearch}
                            onClose={() => setShowTechTreeModal(false)}
                            onSelectResearch={handleSelectResearch}
                        />
                    )}
                    {showCivilopediaModal && (
                        <Civilopedia
                            onClose={() => handleViewCivilopediaFromUI(null, false)}
                            initialEntry={civilopediaInitialEntry}
                            technologies={TECHNOLOGIES_DATA}
                            unitTypes={UNIT_TYPES}
                            buildingTypes={BUILDING_TYPES}
                        />
                    )}
                    {gameState.gameOver && gameState.victoryType && (
                        <div className="fixed inset-0 flex items-center justify-center bg-black/90 z-50">
                            <div className="bg-stone-900 border-4 border-amber-500 p-8 rounded-lg max-w-2xl text-center">
                                <h2 className="text-4xl font-bold text-amber-400 mb-6">
                                    {gameState.victoryType === 'science'
                                        ? 'НАУЧНАЯ ПОБЕДА!'
                                        : 'ВОЕННАЯ ПОБЕДА!'}
                                </h2>
                                <p className="text-2xl text-white mb-8">
                                    {gameState.victoryType === 'science'
                                        ? 'Ваша цивилизация достигла вершин научного прогресса и обогнала всех соперников!'
                                        : 'Ваша империя покорила большую часть мира своей военной мощью!'}
                                </p>
                                <p className="text-lg text-stone-300 mb-4">
                                    Ваша цивилизация процветает в {gameState.currentTurn} году.
                                </p>
                                <button
                                    className="mt-6 px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-lg transition-colors"
                                    onClick={() => setGameState({...gameState, gameOver: false})}
                                >
                                    Продолжить игру
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Модальное окно сохранения */}
                    {showSaveModal && (
                        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                            <div className="bg-stone-800 p-6 rounded-lg max-w-md w-full border border-amber-600">
                                <h3 className="text-xl font-bold text-amber-400 mb-4">Сохранить игру</h3>
                                <input
                                    type="text"
                                    value={saveName}
                                    onChange={(e) => setSaveName(e.target.value)}
                                    placeholder="Введите название сохранения"
                                    className="w-full bg-stone-700 text-white px-3 py-2 rounded mb-4 border border-stone-600"
                                    autoFocus
                                />
                                <div className="flex space-x-3 justify-end">
                                    <button
                                        className="px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white rounded"
                                        onClick={() => setShowSaveModal(false)}
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium"
                                        onClick={saveGameToStorage}
                                    >
                                        Сохранить
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default Game;