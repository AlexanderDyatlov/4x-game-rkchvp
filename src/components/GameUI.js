import React, { useState } from 'react';
import Civilopedia from './Civilopedia';
import TechTree from './TechTree';

const GameUI = ({
                    gameState,
                    onEndTurn,
                    onFoundCity,
                    onBuildUnit,
                    onBuildBuilding,
                    onMoveUnit,
                    onAttackUnit,
                    onCitySelect,
                    onUnitSelect,
                    onToggleWorker,
                    onCancelProduction,
                    onSelectResearch,
                    onCancelResearch,
                    unitTypes,
                    buildingTypes,
                    onViewCivilopedia,
                    baseFoodForGrowth,
                    growthFactor,
                    onOpenTechTree,
                    onHarvestResource,
                    isTechTreeModalOpen,
                    isCivilopediaModalOpen,
                    onStartRenameCity,
                    onCityNameChange,
                    onConfirmRenameCity,
                    onCancelRenameCity,
                    onSaveGame,
                    onExitToMenu
                }) => {
    // Локальное состояние GameUI для управления видимостью модалок, инициируемых из GameUI
    const [showTechTreeLocal, setShowTechTreeLocal] = useState(false);
    const [showCivilopediaLocal, setShowCivilopediaLocal] = useState(false);
    const [civilopediaEntryLocal, setCivilopediaEntryLocal] = useState(null);
    const [showVictoryConditions, setShowVictoryConditions] = useState(false);

    const handleOpenCivilopediaLocal = (entry) => {
        setCivilopediaEntryLocal(entry);
        setShowCivilopediaLocal(true);
        if (onViewCivilopedia) onViewCivilopedia(entry, true);
    };

    const handleCloseCivilopediaLocal = () => {
        setShowCivilopediaLocal(false);
        setCivilopediaEntryLocal(null);
        if (onViewCivilopedia) onViewCivilopedia(null, false);
    };

    const handleOpenTechTreeLocal = () => {
        setShowTechTreeLocal(true);
        if (onOpenTechTree) onOpenTechTree(true);
    };

    const handleCloseTechTreeLocal = () => {
        setShowTechTreeLocal(false);
        if (onOpenTechTree) onOpenTechTree(false);
    };

    const unitTypesArray = Object.values(unitTypes || {});
    const buildingTypesArray = Object.values(buildingTypes || {});
    const selectedUnit = gameState.selectedUnitId ? gameState.units.find(u => u.id === gameState.selectedUnitId) : null;

    const isAnyModalPreventingClicks = isTechTreeModalOpen || isCivilopediaModalOpen || (gameState.selectedCityId !== null) || showVictoryConditions;

    // Подсчет прогресса к условиям победы
    const scienceVictoryTechs = ['mathematics'];
    const scienceVictoryCount = 5; // Общее количество технологий для победы

    const hasMathematicsTech = gameState.technologies.find(t => t.id === 'mathematics')?.researched;
    const researchedTechsCount = gameState.technologies.filter(t => t.researched).length;

    const totalCities = gameState.cities.length;
    const playerCities = gameState.cities.filter(c => c.owner === 'player').length;
    const dominationPercent = totalCities > 0 ? Math.floor((playerCities / totalCities) * 100) : 0;

    return (
        <>
            {isAnyModalPreventingClicks && (
                <div className="fixed inset-0 z-20" />
            )}

            <div className="fixed inset-0 pointer-events-none z-10">
                <div className={`absolute top-0 left-0 right-0 bg-stone-800/95 p-2 flex justify-between items-center h-12 ${!isAnyModalPreventingClicks ? 'pointer-events-auto' : ''}`}>
                    <div className="flex space-x-4 text-white text-sm items-center">
                        <span>🏙️ {gameState.cities?.filter(c => c.owner === 'player').length || 0}</span>
                        <span>👤 {gameState.cities?.filter(c => c.owner === 'player').reduce((sum, city) => sum + (city.population || 0), 0) || 0}</span>
                        <span className="text-yellow-400">💰 {gameState.gold || 0}</span>
                        <span>⚒️ {gameState.cities?.filter(c => c.owner === 'player').reduce((sum, city) => sum + (city.productionYield || 0), 0) || 0}</span>
                        <span className="text-blue-400">🔬 {gameState.cities?.filter(c => c.owner === 'player').reduce((sum, city) => sum + (city.scienceYield || 0), 0) || 0}</span>

                        {/* Кнопка просмотра условий победы */}
                        <button
                            onClick={() => setShowVictoryConditions(true)}
                            className="ml-2 bg-amber-700/60 hover:bg-amber-600 px-2 py-1 rounded text-xs"
                        >
                            👑 Условия победы
                        </button>
                    </div>
                    <div className="flex items-center">
                        {/* Кнопки сохранения и выхода в меню */}
                        <button
                            className="bg-stone-700 hover:bg-stone-600 text-white px-2 py-1 rounded text-sm mr-2"
                            onClick={onSaveGame}
                        >
                            💾 Сохранить
                        </button>

                        <button
                            className="bg-stone-700 hover:bg-stone-600 text-white px-2 py-1 rounded text-sm mr-2"
                            onClick={onExitToMenu}
                        >
                            📋 Меню
                        </button>

                        {gameState.currentResearch ? (
                            <div className="flex items-center bg-stone-700 rounded p-1 mr-2 text-xs">
                                <div className="mr-1">
                                    <div className="text-amber-400 truncate max-w-[100px]">{gameState.currentResearch.name}</div>
                                    <div className="flex items-center space-x-1">
                                        <div className="text-white">{gameState.currentResearch.progress || 0}/{gameState.currentResearch.cost || 1}</div>
                                        <div className="w-16 h-1.5 bg-stone-600 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-amber-500"
                                                style={{ width: `${((gameState.currentResearch.progress || 0) / (gameState.currentResearch.cost || 1)) * 100}%` }}
                                            ></div>
                                        </div>
                                        {onCancelResearch && (
                                            <button className="text-red-400 hover:text-red-300 text-lg leading-none -mt-0.5" onClick={onCancelResearch}>×</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            onSelectResearch && <button
                                className="bg-amber-700 hover:bg-amber-600 text-white px-2 py-1 rounded text-sm mr-2"
                                onClick={handleOpenTechTreeLocal}
                            >
                                Исследовать
                            </button>
                        )}
                        <button
                            className="bg-stone-700 hover:bg-stone-600 text-white px-2 py-1 rounded text-sm mr-2"
                            onClick={handleOpenTechTreeLocal}
                        >
                            Технологии
                        </button>
                        <button
                            className="bg-stone-700 hover:bg-stone-600 text-white px-2 py-1 rounded text-sm"
                            onClick={() => handleOpenCivilopediaLocal(null)}
                        >
                            Справочник
                        </button>
                    </div>
                </div>

                <div className={`absolute top-14 right-2 w-64 bg-stone-800/90 p-2 max-h-[calc(100vh-120px)] overflow-y-auto border border-stone-700/50 rounded-lg shadow-xl ${!isAnyModalPreventingClicks ? 'pointer-events-auto' : ''}`}>
                    <h3 className="text-amber-400 font-semibold mb-2 text-center border-b border-stone-700/50 pb-1">События</h3>
                    <div className="space-y-1">
                        {(gameState.gameMessages || []).slice(-20).reverse().map((message, idx) => (
                            <div key={idx} className="text-white text-xs p-1.5 bg-stone-700/50 rounded shadow-sm">
                                {message}
                            </div>
                        ))}
                    </div>
                </div>

                <div className={`absolute bottom-0 left-0 right-0 bg-stone-800/95 p-2 flex justify-between items-center min-h-[56px] border-t border-stone-700/50 ${!isAnyModalPreventingClicks ? 'pointer-events-auto' : ''}`}>
                    <div className="flex items-center space-x-3">
                        <span className="text-white bg-stone-700 px-3 py-1.5 rounded-md text-sm">Ход: {gameState.currentTurn || 1}</span>
                        {selectedUnit && selectedUnit.type === 'Поселенец' && onFoundCity && (
                            <button
                                className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-md text-sm flex items-center"
                                onClick={() => onFoundCity(selectedUnit.id)}
                                title="Основать новый город на текущей клетке"
                            >
                                <span className="mr-1.5">🏙️</span> Основать город
                            </button>
                        )}
                        {selectedUnit && (
                            <div className="flex items-center space-x-2 bg-stone-700/80 p-1.5 rounded-md">
                                <div className="text-2xl px-1">{selectedUnit.icon || '👤'}</div>
                                <div className="pr-1">
                                    <div className="text-white text-sm font-semibold">{selectedUnit.type}</div>
                                    <div className="text-xs text-amber-300">
                                        ❤️ {selectedUnit.health}/{selectedUnit.maxHealth} | 🏃 {selectedUnit.movesLeft || 0}/{selectedUnit.maxMoves || 0}
                                    </div>
                                </div>
                                {selectedUnit.movesLeft > 0 && onMoveUnit && (
                                    <button
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded text-xs"
                                        onClick={() => onMoveUnit(selectedUnit.id)}
                                    >
                                        Движение
                                    </button>
                                )}
                                {selectedUnit.attack > 0 && !(selectedUnit.hasAttacked) && onAttackUnit && (
                                    <button
                                        className="bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 rounded text-xs"
                                        onClick={() => onAttackUnit(selectedUnit.id)}
                                    >
                                        Атака
                                    </button>
                                )}
                                {selectedUnit.type === 'Рыбацкая лодка' && onHarvestResource && (
                                    <button
                                        className="bg-teal-600 hover:bg-teal-500 text-white px-2.5 py-1 rounded text-xs"
                                        onClick={() => onHarvestResource(selectedUnit.id)}
                                    >
                                        🌊 Улов
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    {onEndTurn && (
                        <button
                            className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-md font-semibold"
                            onClick={onEndTurn}
                        >
                            Завершить ход
                        </button>
                    )}
                </div>
            </div>

            {/* МОДАЛЬНОЕ ОКНО УСЛОВИЙ ПОБЕДЫ */}
            {showVictoryConditions && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center"
                    onClick={() => setShowVictoryConditions(false)}
                >
                    <div
                        className="bg-stone-800 w-full max-w-md rounded-lg shadow-2xl p-6 border border-amber-600/30"
                        onClick={e => e.stopPropagation()}
                    >
                        <h2 className="text-amber-400 text-2xl font-bold mb-4">Условия Победы</h2>

                        {/* Научная победа */}
                        <div className="mb-6">
                            <h3 className="text-blue-300 text-lg font-semibold mb-2 flex items-center">
                                <span className="mr-2">🔬</span> Научная Победа
                            </h3>
                            <div className="pl-6 space-y-3">
                                {/* Прогресс по математике */}
                                <div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-stone-200">Математика (обязательно):</span>
                                        <span className="text-stone-200 font-semibold">
                                                {hasMathematicsTech ? 'Выполнено ✓' : 'В процессе ✗'}
                                        </span>
                                    </div>
                                    <div className="bg-stone-700 h-2 rounded-full w-full">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full"
                                            style={{ width: `${hasMathematicsTech ? 100 : 0}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Прогресс по общему числу технологий */}
                                <div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-stone-200">Всего исследовано технологий:</span>
                                        <span className="text-stone-200 font-semibold">
                                            {researchedTechsCount}/{scienceVictoryCount}
                                        </span>
                                    </div>
                                    <div className="bg-stone-700 h-2 rounded-full w-full">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full"
                                            style={{ width: `${(researchedTechsCount / scienceVictoryCount) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-stone-400 mt-2">
                                Для научной победы необходимо исследовать минимум 5 технологий, включая Математику.
                            </p>
                        </div>

                        {/* Военная победа */}
                        <div className="mb-6">
                            <h3 className="text-red-300 text-lg font-semibold mb-2 flex items-center">
                                <span className="mr-2">⚔️</span> Военная Победа
                            </h3>
                            <div className="pl-6 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-stone-200">Контроль городов:</span>
                                    <span className="text-stone-200 font-semibold">{dominationPercent}% / 70%</span>
                                </div>
                                <div className="bg-stone-700 h-2 rounded-full w-full">
                                    <div
                                        className="bg-red-500 h-2 rounded-full"
                                        style={{ width: `${Math.min(100, (dominationPercent / 70) * 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                            <p className="text-xs text-stone-400 mt-2">
                                Захватите 70% всех городов в мире, чтобы достичь военного превосходства.
                            </p>
                        </div>

                        <button
                            className="bg-stone-700 hover:bg-stone-600 text-white px-4 py-2 rounded w-full mt-4"
                            onClick={() => setShowVictoryConditions(false)}
                        >
                            Закрыть
                        </button>
                    </div>
                </div>
            )}

            {/* МОДАЛЬНЫЕ ОКНА - управляются пропсами из Game.js */}
            {isTechTreeModalOpen && (
                <TechTree
                    technologies={gameState.technologies || []}
                    currentResearch={gameState.currentResearch}
                    onClose={() => { if(onOpenTechTree) onOpenTechTree(false); }}
                    onSelectResearch={onSelectResearch}
                />
            )}

            {isCivilopediaModalOpen && (
                <Civilopedia
                    unitTypes={unitTypesArray}
                    buildingTypes={buildingTypesArray}
                    technologies={gameState.technologies || []}
                    onClose={() => { if(onViewCivilopedia) onViewCivilopedia(null, false);}}
                    initialEntry={gameState.selectedCivilopediaEntry}
                />
            )}

            {gameState.selectedCityId && gameState.cities.find(c => c.id === gameState.selectedCityId) && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 flex items-center justify-center pointer-events-auto"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            if (onCitySelect) onCitySelect(null);
                        }
                    }}
                >
                    <CityPanel
                        city={gameState.cities.find(c => c.id === gameState.selectedCityId)}
                        gameState={gameState}
                        buildingTypes={buildingTypes}
                        unitTypes={unitTypes}
                        onBuildUnit={onBuildUnit}
                        onBuildBuilding={onBuildBuilding}
                        onToggleWorker={onToggleWorker}
                        onCloseCityPanelFromInside={() => {if (onCitySelect) onCitySelect(null);}}
                        onCancelProduction={onCancelProduction}
                        onViewCivilopedia={(entry) => { // Передаем функцию для открытия Справочника из CityPanel
                            if (onViewCivilopedia) onViewCivilopedia(entry, true);
                        }}
                        baseFoodForGrowth={baseFoodForGrowth}
                        growthFactor={growthFactor}
                        onStartRenameCity={onStartRenameCity}
                        onCityNameChange={onCityNameChange}
                        onConfirmRenameCity={onConfirmRenameCity}
                        onCancelRenameCity={onCancelRenameCity}
                    />
                </div>
            )}
        </>
    );
};

// CityPanel с поддержкой переименования городов
const CityPanel = ({
                       city, gameState, buildingTypes, unitTypes,
                       onBuildUnit, onBuildBuilding, onToggleWorker,
                       onCancelProduction, onViewCivilopedia,
                       baseFoodForGrowth,
                       growthFactor,
                       onCloseCityPanelFromInside,
                       onStartRenameCity,
                       onCityNameChange,
                       onConfirmRenameCity,
                       onCancelRenameCity
                   }) => {
    const [activeTab, setActiveTab] = useState('overview');
    if (!city) return null;

    const isRenaming = gameState.renamingCityId === city.id;

    // Передаем ОБЪЕКТЫ unitTypes и buildingTypes в calculateCityProduction и ProductionItemButton
    const cityProd = calculateCityProduction(city, gameState.map, buildingTypes);

    const foodForGrowth = (baseFoodForGrowth || 15) + ((city.population || 1) * (growthFactor || 5));
    const growthProgress = gameState.cityGrowthProgress?.[city.id] || 0;
    const turnsToGrowthVal = cityProd.food > 0 ? Math.ceil((foodForGrowth - growthProgress) / cityProd.food) : Infinity;
    const turnsToGrowth = isFinite(turnsToGrowthVal) ? `${turnsToGrowthVal} ходов` : '∞';
    const workableTiles = city.workableTiles || [];
    const workingTiles = city.workingTiles || [];
    const currentConstructionItem = city.productionQueue;
    const productionPerTurn = cityProd.production || 1;
    const constructionProgress = currentConstructionItem?.progress || 0;
    const constructionCost = currentConstructionItem?.cost || 1;
    const turnsToCompleteVal = productionPerTurn > 0 && constructionCost > 0 ? Math.ceil((constructionCost - constructionProgress) / productionPerTurn) : Infinity;
    const turnsToComplete = isFinite(turnsToCompleteVal) ? `${turnsToCompleteVal} ходов` : '∞';

    const getConstructionDisplayDetails = (item) => {
        if (!item) return { name: 'Ничего не строится', icon: '🚫' };
        if (item.type === 'unit') {
            const unitInfo = unitTypes[item.id];
            return { name: unitInfo?.type || item.name || item.id, icon: unitInfo?.icon || '👤' };
        }
        if (item.type === 'building') {
            const buildingInfo = buildingTypes[item.id];
            return { name: buildingInfo?.name || item.name || item.id, icon: buildingInfo?.icon || '🏛️' };
        }
        return { name: item.id, icon: '❓' };
    };
    const constructionDisplay = getConstructionDisplayDetails(currentConstructionItem);

    const TabButton = ({ tabId, children }) => (
        <button
            className={`px-4 py-3 text-sm font-medium border-b-2 ${activeTab === tabId ? 'border-amber-500 text-amber-400' : 'border-transparent text-stone-400 hover:text-amber-300 hover:border-amber-400/50'}`}
            onClick={() => setActiveTab(tabId)}
        >
            {children}
        </button>
    );

    const InfoCard = ({ title, children }) => (
        <div className="bg-stone-800/70 p-4 rounded-lg border border-stone-700/50 shadow-md">
            <h3 className="text-lg font-semibold text-amber-400 mb-3 border-b border-stone-600 pb-2">{title}</h3>
            {children}
        </div>
    );

    // ProductionItemButton теперь использует unitTypes и buildingTypes (объекты) напрямую для получения itemData
    const ProductionItemButton = ({ itemKey, type, cityProductionRate, currentQueue, onBuild, localGameState }) => {
        const itemData = type === 'unit' ? unitTypes[itemKey] : buildingTypes[itemKey];
        if (!itemData) return null;

        const isUnit = type === 'unit';
        const name = isUnit ? itemData.type : itemData.name;
        const icon = itemData.icon || (isUnit ? '👤' : '🏛️');
        const cost = itemData.productionCost;

        const isResearched = !itemData.requiresTech || (localGameState.technologies && localGameState.technologies.find(t => t.id === itemData.requiresTech && t.researched));
        const isAlreadyBuilt = !isUnit && (city.buildings || []).some(b => b.id === itemKey);
        const canBuild = isResearched && !isAlreadyBuilt;
        const turns = cityProductionRate > 0 && cost > 0 ? Math.ceil(cost / cityProductionRate) : '∞';
        let reasonDisabled = '';
        if (currentQueue) {
            reasonDisabled = 'Очередь занята';
        } else if (!isResearched) {
            const requiredTechInfo = localGameState.technologies?.find(t => t.id === itemData.requiresTech);
            reasonDisabled = `Нужна: ${requiredTechInfo?.name || itemData.requiresTech}`;
        } else if (isAlreadyBuilt) {
            reasonDisabled = 'Уже построено';
        }
        return (
            <button
                key={itemKey}
                disabled={!canBuild || !!currentQueue}
                onClick={() => onBuild(city.id, itemKey)}
                title={reasonDisabled || `Построить ${name} (${cost}⚒️, ${turns} ходов)`}
                className={`w-full text-left p-3 rounded-md flex items-center transition-colors
                    ${(!canBuild || !!currentQueue)
                    ? 'bg-stone-700/50 opacity-60 cursor-not-allowed'
                    : 'bg-stone-700 hover:bg-stone-600/80'}`}
            >
                <span className="text-2xl mr-3">{icon}</span>
                <div className="flex-grow">
                    <div className="text-white font-medium">{name}</div>
                    <div className="text-xs text-amber-300">⚒️ {cost} ({turns === '∞' ? '?' : turns} ход.)</div>
                </div>
                {(!canBuild && !currentQueue) && (
                    <div className="text-xs text-red-400 ml-2 text-right flex-shrink-0 max-w-[100px] truncate" title={reasonDisabled}>{reasonDisabled}</div>
                )}
            </button>
        );
    };

    return (
        <div
            className="bg-stone-800/95 w-full max-w-3xl h-[90vh] max-h-[700px] rounded-xl shadow-2xl flex flex-col border border-amber-700/50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="bg-stone-800 p-4 flex justify-between items-center rounded-t-xl border-b border-stone-700">
                <div className="flex items-center flex-grow">
                    <span className="text-4xl mr-3 text-amber-400">🏙️</span>
                    <div className="flex-grow">
                        {isRenaming ? (
                            <div className="flex items-center">
                                <input
                                    type="text"
                                    value={gameState.customCityName}
                                    onChange={onCityNameChange}
                                    className="bg-stone-700 text-white px-2 py-1 rounded border border-amber-500 mr-2"
                                    autoFocus
                                    placeholder="Введите название города"
                                />
                                <button
                                    onClick={() => onConfirmRenameCity(city.id, gameState.customCityName)}
                                    className="bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded text-sm mr-1"
                                >
                                    ✓
                                </button>
                                <button
                                    onClick={onCancelRenameCity}
                                    className="bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded text-sm"
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center">
                                <h2 className="text-2xl font-bold text-amber-300 mr-2">
                                    {city.name}
                                </h2>
                                {city.owner === 'player' && (
                                    <button
                                        onClick={() => onStartRenameCity(city.id)}
                                        className="text-xs bg-stone-700 hover:bg-stone-600 text-white px-2 py-0.5 rounded"
                                        title="Переименовать город"
                                    >
                                        ✏️
                                    </button>
                                )}
                            </div>
                        )}
                        <p className="text-sm text-stone-300">Население: {city.population || 1} (Рост через: {turnsToGrowth})</p>
                    </div>
                </div>
                <button className="text-stone-400 hover:text-white text-2xl px-2" onClick={onCloseCityPanelFromInside}>×</button>
            </div>
            <div className="bg-stone-800 px-2 border-b border-stone-700">
                <div className="flex space-x-1">
                    <TabButton tabId="overview">Обзор</TabButton>
                    <TabButton tabId="production">Производство</TabButton>
                    <TabButton tabId="tiles">Управление ({workingTiles.length}/{city.population || 1})</TabButton>
                    <TabButton tabId="buildings">Постройки ({(city.buildings || []).length})</TabButton>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-stone-800/50 rounded-b-xl">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <InfoCard title="Доходы Города">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                <p>🍞 <span className="text-stone-300">Пища:</span> <span className="font-semibold text-white">{cityProd.food}</span></p>
                                <p>⚒️ <span className="text-stone-300">Производство:</span> <span className="font-semibold text-white">{cityProd.production}</span></p>
                                <p>💰 <span className="text-stone-300">Золото:</span> <span className="font-semibold text-white">{cityProd.gold}</span></p>
                                <p>🔬 <span className="text-stone-300">Наука:</span> <span className="font-semibold text-white">{cityProd.science}</span></p>
                            </div>
                        </InfoCard>
                        {currentConstructionItem && (
                            <InfoCard title="Текущее Производство">
                                <div className="flex items-center">
                                    <span className="text-3xl mr-3">{constructionDisplay.icon}</span>
                                    <div>
                                        <p className="text-white font-semibold">{constructionDisplay.name}</p>
                                        <p className="text-xs text-stone-300">Осталось: {turnsToComplete}</p>
                                    </div>
                                </div>
                                <div className="w-full bg-stone-700 rounded h-2.5 my-2">
                                    <div className="bg-amber-500 h-2.5 rounded" style={{ width: `${constructionProgress > 0 && constructionCost > 0 ? (constructionProgress / constructionCost) * 100 : 0}%` }}></div>
                                </div>
                                {onCancelProduction && (
                                    <button onClick={() => onCancelProduction(city.id)} className="text-red-500 hover:text-red-400 text-xs mt-1 p-1 bg-red-800/30 rounded hover:bg-red-700/50">Отменить производство</button>
                                )}
                            </InfoCard>
                        )}
                        {!currentConstructionItem && activeTab === 'overview' && (
                            <InfoCard title="Очередь пуста">
                                <p className="text-stone-400 text-sm">Выберите что-нибудь для производства на вкладке "Производство".</p>
                                <button onClick={() => setActiveTab('production')} className="mt-2 text-sm bg-amber-600 hover:bg-amber-500 text-white px-3 py-1 rounded">К производству</button>
                            </InfoCard>
                        )}
                        <InfoCard title="Рост Населения">
                            <p className="text-sm text-stone-300 mb-1">Прогресс до следующего жителя:</p>
                            <p className="text-white font-semibold">{growthProgress} / {foodForGrowth}</p>
                            <div className="w-full bg-stone-700 rounded h-2.5 mt-1">
                                <div className="bg-green-500 h-2.5 rounded" style={{ width: `${growthProgress > 0 && foodForGrowth > 0 ? (growthProgress / foodForGrowth) * 100 : 0}%` }}></div>
                            </div>
                        </InfoCard>
                    </div>
                )}
                {activeTab === 'production' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InfoCard title={`Юниты (${cityProd.production} ⚒️/ход)`}>
                            <div className="space-y-2 max-h-[calc(90vh-300px)] overflow-y-auto pr-2">
                                {/* Используем ключи объекта UNIT_TYPES для итерации */}
                                {Object.keys(unitTypes || {}).filter(id => unitTypes[id]).map(unitId =>
                                    <ProductionItemButton
                                        key={unitId} itemKey={unitId} itemData={unitTypes[unitId]} type="unit"
                                        cityProductionRate={productionPerTurn} currentQueue={currentConstructionItem}
                                        onBuild={onBuildUnit} localGameState={gameState} cityBuildings={city.buildings}
                                    />
                                )}
                            </div>
                        </InfoCard>
                        <InfoCard title={`Здания (${cityProd.production} ⚒️/ход)`}>
                            <div className="space-y-2 max-h-[calc(90vh-300px)] overflow-y-auto pr-2">
                                {/* Используем ключи объекта BUILDING_TYPES для итерации */}
                                {Object.keys(buildingTypes || {}).filter(id => buildingTypes[id]).map(buildingId =>
                                    <ProductionItemButton
                                        key={buildingId} itemKey={buildingId} itemData={buildingTypes[buildingId]} type="building"
                                        cityProductionRate={productionPerTurn} currentQueue={currentConstructionItem}
                                        onBuild={onBuildBuilding} localGameState={gameState} cityBuildings={city.buildings}
                                    />
                                )}
                            </div>
                        </InfoCard>
                    </div>
                )}
                {activeTab === 'tiles' && (
                    <InfoCard title={`Управление Землями (${workingTiles.length}/${city.population || 1} жителей)`}>
                        <p className="text-xs text-stone-400 mb-3">Назначьте жителей на обработку клеток для увеличения доходов города.</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[calc(90vh-280px)] overflow-y-auto pr-2">
                            {(workableTiles || []).map(tile => {
                                const mapTile = gameState.map[tile.y]?.[tile.x];
                                if (!mapTile) return null;
                                const isWorked = (workingTiles || []).some(wt => wt.x === tile.x && wt.y === tile.y);
                                const canWorkMore = (workingTiles || []).length < (city.population || 1);
                                const tileIcons = { water: '🌊', grass: '🌿', forest: '🌲', mountain: '⛰️', desert: '🏜️' };
                                return (
                                    <div key={`${tile.x}-${tile.y}`}
                                         className={`p-3 rounded-lg border transition-all
                                                    ${isWorked ? 'border-green-500 bg-green-700/20 shadow-lg' : 'border-stone-600 bg-stone-700/40 hover:bg-stone-600/50'}`}>
                                        <div className="flex items-center mb-1">
                                            <span className="text-xl mr-2">{tileIcons[mapTile.type] || '🌍'}</span>
                                            <span className="text-sm font-medium text-white capitalize">{mapTile.type} </span>
                                        </div>
                                        <div className="text-xs text-stone-300 mb-2">
                                            {mapTile.food > 0 && `+${mapTile.food}🍞 `}
                                            {mapTile.production > 0 && `+${mapTile.production}⚒️ `}
                                            {mapTile.gold > 0 && `+${mapTile.gold}💰`}
                                        </div>
                                        <button
                                            onClick={() => onToggleWorker(city.id, tile.x, tile.y)}
                                            disabled={mapTile.type === 'mountain' || (!isWorked && !canWorkMore)}
                                            className={`w-full mt-1 text-xs px-2 py-1.5 rounded-md font-medium transition-colors
                                                        ${isWorked ? 'bg-red-600 hover:bg-red-500 text-white' :
                                                (canWorkMore && mapTile.type !== 'mountain' ? 'bg-green-600 hover:bg-green-500 text-white' :
                                                    'bg-stone-600 text-stone-400 cursor-not-allowed')}`}>
                                            {isWorked ? 'Убрать' : (canWorkMore && mapTile.type !== 'mountain' ? 'Назначить' : (mapTile.type === 'mountain' ? 'Нельзя' : 'Нет жителей'))}
                                        </button>
                                    </div>
                                );
                            })}
                            {(workableTiles || []).length === 0 && <p className="text-stone-400 col-span-full text-center py-4">Нет доступных клеток.</p>}
                        </div>
                    </InfoCard>
                )}
                {activeTab === 'buildings' && (
                    <InfoCard title="Построенные Здания">
                        {(city.buildings || []).length > 0 ? (
                            <div className="space-y-3">
                                {(city.buildings || []).map(building => (
                                    <div key={building.id || building.name} className="bg-stone-700/60 p-3 rounded-md flex items-start">
                                        <span className="text-3xl mr-3 pt-0.5">{building.icon || '🏛️'}</span>
                                        <div>
                                            <h4 className="text-white font-semibold">{building.name}</h4>
                                            <p className="text-xs text-stone-300 mb-1">{building.description}</p>
                                            <div className="text-xs text-amber-300">
                                                {building.effect === 'food' && `+${building.bonus} 🍞, `}
                                                {building.effect === 'production' && `+${building.bonus} ⚒️, `}
                                                {building.effect === 'gold' && `+${building.bonus} 💰, `}
                                                {building.effect === 'science' && `+${building.bonus} 🔬, `}
                                                <span className="text-stone-400">Содержание: {building.maintainCost || 0}💰</span>
                                            </div>
                                        </div>
                                        <button onClick={() => onViewCivilopedia({type: 'building', id: building.id})} className="ml-auto text-xs text-blue-400 hover:text-blue-300 p-1 bg-blue-800/30 rounded"> (i) </button>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-stone-400 text-center py-4">В этом городе еще нет зданий.</p>}
                    </InfoCard>
                )}
            </div>
        </div>
    );
};

const calculateCityProduction = (city, map, buildingTypesObject) => {
    if (!city || !map || !buildingTypesObject) return { food: 0, production: 0, gold: 0, science: 0 };
    let food = 2;
    let production = 1;
    let gold = 1;
    let science = city.population || 1;
    (city.workingTiles || []).forEach(tilePos => {
        const tile = map[tilePos.y]?.[tilePos.x];
        if (tile) {
            food += tile.food || 0;
            production += tile.production || 0;
            gold += tile.gold || 0;
        }
    });
    (city.buildings || []).forEach(builtBuilding => {
        const buildingData = buildingTypesObject[builtBuilding.id];
        if (buildingData) {
            if (buildingData.effect === 'food') food += buildingData.bonus || 0;
            if (buildingData.effect === 'production') production += buildingData.bonus || 0;
            if (buildingData.effect === 'gold') gold += buildingData.bonus || 0;
            if (buildingData.effect === 'science') science += buildingData.bonus || 0;
        }
    });
    return { food, production, gold, science };
};

export default GameUI;