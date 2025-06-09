import React, { useState, useEffect } from 'react';

const Civilopedia = ({ onClose, initialEntry, technologies, unitTypes, buildingTypes }) => {
    const [category, setCategory] = useState('unit');
    const [selectedItem, setSelectedItem] = useState(null);

    const allUnits = Object.values(unitTypes || {});
    const allBuildings = Object.values(buildingTypes || {});
    const allTechnologies = technologies || [];

    const RESOURCES_INFO = {
        fish: { name: "Рыба", icon: "🐟", description: "Морской ресурс, обеспечивающий дополнительную пищу прибрежным городам. Может быть собран Рыбацкой лодкой для получения золота.", yields: { food: 2 } },
        gems: { name: "Драгоценные камни", icon: "💎", description: "Роскошный ресурс, приносящий золото. Редко встречается в тундре и горных районах.", yields: { gold: 2 } }
    };

    const ALL_RESOURCE_IDS = Object.keys(RESOURCES_INFO);

    const TERRAIN_INFO = {
        water: { name: "Вода", description: "Обширные водные пространства. Пересекаются морскими юнитами. Прибрежные города могут строить порты.", icon: "🌊", food: 1, production: 0, gold: 0 },
        grass: { name: "Луга", description: "Плодородные травянистые земли, идеальны для фермерства. Высокий прирост пищи.", icon: "🌿", food: 2, production: 0, gold: 0 },
        plains: { name: "Равнины", description: "Открытые равнины, подходят для сельского хозяйства и пастбищ. Сбалансированный доход пищи и производства.", icon: "🌾", food: 1, production: 1, gold: 0 },
        forest: { name: "Лес", description: "Густые лесные массивы. Затрудняют передвижение, но хороший источник производства. Могут быть вырублены.", icon: "🌲", food: 1, production: 2, gold: 0 },
        hills: { name: "Холмы", description: "Пересеченная местность. Дают защитное преимущество и часто содержат минералы, увеличивающие производство.", icon: "🌄", food: 1, production: 2, gold: 0 },
        mountain: { name: "Горы", description: "Непреодолимые горные цепи. Блокируют движение наземных юнитов, но могут быть источником ценных ресурсов.", icon: "⛰️", food: 0, production: 1, gold: 0 },
        desert: { name: "Пустыня", description: "Засушливые земли. Мало пищи, но могут скрывать оазисы или золото.", icon: "🏜️", food: 0, production: 0, gold: 1 },
        tundra: { name: "Тундра", description: "Холодные, безлесные земли. Ограниченные возможности для сельского хозяйства, но могут содержать уникальные ресурсы.", icon: "❄️", food: 1, production: 0, gold: 0 },
        jungle: { name: "Джунгли", description: "Густые и влажные заросли. Затрудняют движение. Могут быть богаты ресурсами и давать бонус к науке.", icon: "🌴", food: 1, production: 1, science: 1 }
    };
    const ALL_TERRAIN_TYPES = Object.keys(TERRAIN_INFO);

    useEffect(() => {
        if (initialEntry) {
            setCategory(initialEntry.type);
            setSelectedItem(initialEntry.id);
        } else if (category === 'unit' && allUnits.length > 0 && !selectedItem) {
            setSelectedItem(allUnits[0].id);
        } else if (category === 'building' && allBuildings.length > 0 && !selectedItem) {
            setSelectedItem(allBuildings[0].id);
        } else if (category === 'technology' && allTechnologies.length > 0 && !selectedItem) {
            setSelectedItem(allTechnologies[0].id);
        } else if (category === 'resource' && ALL_RESOURCE_IDS.length > 0 && !selectedItem) {
            setSelectedItem(ALL_RESOURCE_IDS[0]);
        } else if (category === 'terrain' && ALL_TERRAIN_TYPES.length > 0 && !selectedItem) {
            setSelectedItem(ALL_TERRAIN_TYPES[0]);
        }
    }, [initialEntry, category, allUnits, allBuildings, allTechnologies, selectedItem, ALL_RESOURCE_IDS, ALL_TERRAIN_TYPES]);

    const techTranslations = {
        'agriculture': 'Земледелие', 'archery': 'Стрельба из лука', 'mining': 'Горное дело',
        'sailing': 'Мореходство', 'bronze_working': 'Обработка бронзы', 'writing': 'Письменность',
        'woodworking': 'Деревообработка', 'horseback_riding': 'Верховая езда', 'currency': 'Валюта',
        'mathematics': 'Математика', 'naval_warfare': 'Морской бой',
    };
    const buildingUnitTranslations = {
        'GRANARY': 'Амбар', 'SAWMILL': 'Лесопилка','MINE': 'Шахта', 'LIBRARY': 'Библиотека',
        'MARKET': 'Рынок', 'HARBOR': 'Гавань', 'SETTLER': 'Поселенец', 'WARRIOR': 'Воин',
        'ARCHER': 'Лучник', 'HORSEMAN': 'Всадник', 'SWORDSMAN': 'Мечник',
        'FISHING_BOAT': 'Рыбацкая лодка', 'GALLEY': 'Галера', 'TRIREME': 'Трирема'
    };
    const translateId = (id) => buildingUnitTranslations[id] || techTranslations[id] || id;

    const renderSelectedItem = () => {
        let selectedEntryData = null;
        let entryTypeForRender = category;

        if (category === 'unit') {
            selectedEntryData = allUnits.find(item => item.id === selectedItem);
        } else if (category === 'building') {
            selectedEntryData = allBuildings.find(item => item.id === selectedItem);
        } else if (category === 'technology') {
            selectedEntryData = allTechnologies.find(item => item.id === selectedItem);
        } else if (category === 'terrain') {
            selectedEntryData = TERRAIN_INFO[selectedItem] ? { ...TERRAIN_INFO[selectedItem], id: selectedItem } : null;
            if (selectedEntryData) entryTypeForRender = 'terrain';
        } else if (category === 'resource') {
            selectedEntryData = RESOURCES_INFO[selectedItem] ? { ...RESOURCES_INFO[selectedItem], id: selectedItem } : null;
            if (selectedEntryData) entryTypeForRender = 'resource';
        }

        if(selectedEntryData && !selectedEntryData.typeAsProp) {
            selectedEntryData.typeAsProp = entryTypeForRender;
        }

        return selectedEntryData ? renderEntryDetails(selectedEntryData) : (
            <div className="flex-1 flex items-center justify-center p-6">
                <p className="text-stone-400 text-lg">Выберите элемент из списка для просмотра информации.</p>
            </div>
        );
    };

    const renderEntryDetails = (entry) => {
        let title = "Неизвестно";
        let icon = "❓";
        const currentEntryType = entry.typeAsProp || category;

        if (currentEntryType === 'unit') {
            title = entry.type;
            icon = entry.icon || "👤";
        } else if (currentEntryType === 'building') {
            title = entry.name;
            icon = entry.icon || "🏛️";
        } else if (currentEntryType === 'technology') {
            title = entry.name;
            icon = "🔬";
        } else if (currentEntryType === 'terrain') {
            title = entry.name;
            icon = entry.icon || "🌍";
        } else if (currentEntryType === 'resource') {
            title = entry.name;
            icon = entry.icon || "💎";
        }

        return (
            <div className="flex-1 overflow-y-auto p-6 bg-stone-800/50">
                <div className="max-w-2xl mx-auto bg-stone-700/70 rounded-lg border border-stone-600 p-6 shadow-xl">
                    <div className="flex items-start mb-6">
                        <div className="text-6xl mr-6 p-2 bg-stone-800/50 rounded-md shadow">{icon}</div>
                        <div className="flex-1">
                            <h3 className="text-3xl font-bold text-amber-300 mb-2">{title}</h3>
                            {currentEntryType === 'unit' && (
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-stone-200">
                                    {entry.attack !== undefined && <p>⚔️ Атака: <span className="font-semibold">{entry.attack}</span></p>}
                                    {entry.defense !== undefined && <p>🛡️ Защита: <span className="font-semibold">{entry.defense}</span></p>}
                                    {entry.maxHealth !== undefined && <p>❤️ Здоровье: <span className="font-semibold">{entry.maxHealth}</span></p>}
                                    {entry.maxMoves !== undefined && <p>🏃 Движение: <span className="font-semibold">{entry.maxMoves}</span></p>}
                                    {entry.attackRange > 1 && <p>🎯 Дальность: <span className="font-semibold">{entry.attackRange}</span></p>}
                                    {entry.naval && <p className="text-blue-300 col-span-2">🌊 Морской юнит</p>}
                                    {entry.productionCost !== undefined && <p>⚒️ Стоимость: <span className="font-semibold">{entry.productionCost}</span></p>}
                                    {entry.maintainCost > 0 && <p>💰 Содержание: <span className="font-semibold">{entry.maintainCost}</span></p>}
                                </div>
                            )}
                            {currentEntryType === 'building' && (
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-stone-200">
                                    {entry.effect === 'food' && <p>🌾 Эффект: <span className="font-semibold">+{entry.bonus} пищи</span></p>}
                                    {entry.effect === 'production' && <p>🪵 Эффект: <span className="font-semibold">+{entry.bonus} производства</span></p>}
                                    {entry.effect === 'gold' && <p>💰 Эффект: <span className="font-semibold">+{entry.bonus} золота</span></p>}
                                    {entry.effect === 'science' && <p>📚 Эффект: <span className="font-semibold">+{entry.bonus} науки</span></p>}
                                    {entry.effect === 'naval' && <p>⚓ Эффект: <span className="font-semibold">+{entry.bonus} (морской)</span></p>}
                                    {entry.productionCost !== undefined && <p>⚒️ Стоимость: <span className="font-semibold">{entry.productionCost}</span></p>}
                                    {entry.maintainCost > 0 && <p>💰 Содержание: <span className="font-semibold">{entry.maintainCost}</span></p>}
                                </div>
                            )}
                            {currentEntryType === 'technology' && (
                                <div className="space-y-1 text-sm text-stone-200">
                                    <p>⏳ Эпоха: <span className="font-semibold">{entry.era}</span></p>
                                    <p>🔬 Стоимость: <span className="font-semibold">{entry.cost} науки</span></p>
                                    {entry.prerequisites && entry.prerequisites.length > 0 && (
                                        <p>🔑 Требуется: <span className="font-semibold">{entry.prerequisites.map(techId => allTechnologies.find(t=>t.id === techId)?.name || techId).join(', ')}</span></p>
                                    )}
                                </div>
                            )}
                            {currentEntryType === 'terrain' && (
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-stone-200">
                                    <p>🌿 Пища: <span className="font-semibold">{entry.food || 0}</span></p>
                                    <p>⚒️ Произ-во: <span className="font-semibold">{entry.production || 0}</span></p>
                                    <p>💰 Золото: <span className="font-semibold">{entry.gold || 0}</span></p>
                                    <p>🔬 Наука: <span className="font-semibold">{entry.science || 0}</span></p>
                                </div>
                            )}
                            {currentEntryType === 'resource' && (
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-stone-200">
                                    {entry.yields?.food > 0 && <p>🌿 Пища: <span className="font-semibold">+{entry.yields.food}</span></p>}
                                    {entry.yields?.production > 0 && <p>⚒️ Производство: <span className="font-semibold">+{entry.yields.production}</span></p>}
                                    {entry.yields?.gold > 0 && <p>💰 Золото: <span className="font-semibold">+{entry.yields.gold}</span></p>}
                                    {entry.yields?.science > 0 && <p>🔬 Наука: <span className="font-semibold">+{entry.yields.science}</span></p>}
                                    {entry.yields?.culture > 0 && <p>🎭 Культура: <span className="font-semibold">+{entry.yields.culture}</span></p>}
                                </div>
                            )}
                        </div>
                    </div>

                    <p className="text-stone-100 text-base mb-6 leading-relaxed">{entry.description || "Описание отсутствует."}</p>

                    {(currentEntryType === 'unit' || currentEntryType === 'building') && entry.requiresTech && (
                        <div className="mt-4 p-3 bg-stone-800/60 rounded-md border border-stone-600">
                            <p className="text-sm text-amber-400">Требуется технология: <span className="font-semibold text-amber-200">{allTechnologies.find(t=>t.id === entry.requiresTech)?.name || entry.requiresTech}</span></p>
                        </div>
                    )}

                    {currentEntryType === 'technology' && entry.unlocks && entry.unlocks.length > 0 && (
                        <div className="mt-4 p-3 bg-stone-800/60 rounded-md border border-stone-600">
                            <p className="text-sm text-amber-400 mb-1">Открывает:</p>
                            <ul className="list-disc list-inside text-sm text-stone-200 space-y-0.5">
                                {entry.unlocks.map((itemId, idx) => (
                                    <li key={idx}>{translateId(itemId)}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {currentEntryType === 'unit' && (
                        <div className="mt-6 p-4 bg-stone-800/60 rounded-md border border-stone-600">
                            <h4 className="text-lg font-semibold text-amber-400 mb-2">Стратегическое использование</h4>
                            <p className="text-sm text-stone-200 leading-normal">
                                {`Юнит "${title}" `}
                                {entry.naval ? "предназначен для действий на воде. " : "является наземным юнитом. "}
                                {entry.attack === 0 && entry.type === 'Поселенец' ? "Не боевой юнит, используется для основания новых городов. " : ""}
                                {entry.attack > 0 && entry.attack <= 5 ? "Обладает слабой атакой, используйте для разведки или в группе. " : ""}
                                {entry.attack > 5 && entry.attack <= 10 ? "Хорошо сбалансированный боец. " : ""}
                                {entry.attack > 10 ? "Обладает сокрушительной атакой! " : ""}
                                {entry.defense <= 3 ? "Имеет слабую защиту. " : ""}
                                {entry.defense > 3 && entry.defense <= 7 ? "Обладает средней защитой. " : ""}
                                {entry.defense > 7 ? "Отлично защищен. " : ""}
                                {entry.maxMoves >= 4 ? "Очень мобилен. " : ""}
                                {entry.maxMoves <= 2 ? "Имеет ограниченную мобильность. " : ""}
                                {entry.attackRange > 1 ? `Может атаковать на расстоянии ${entry.attackRange} кл. ` : ""}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                className="bg-stone-800 w-full max-w-5xl h-[90vh] rounded-xl shadow-2xl flex flex-col border border-amber-700/50 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-stone-900 border-b border-amber-600 p-4 flex justify-between items-center">
                    <h2 className="text-2xl text-amber-400 font-bold">Справочник</h2>
                    <button
                        className="px-3 py-1 bg-red-700 hover:bg-red-600 text-white rounded text-sm"
                        onClick={onClose}
                    >
                        Закрыть
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    <div className="w-64 bg-stone-800 border-r border-stone-700 flex flex-col">
                        <div className="p-3 border-b border-stone-600">
                            <h3 className="text-amber-300 font-semibold mb-2 text-sm">Категории</h3>
                            <div className="space-y-1">
                                {[{id: 'unit', name: 'Юниты'}, {id: 'building', name: 'Здания'}, {id: 'technology', name: 'Технологии'}, {id: 'resource', name: 'Ресурсы'}, {id: 'terrain', name: 'Местность'}].map(cat => (
                                    <button
                                        key={cat.id}
                                        className={`w-full text-left px-3 py-1.5 text-xs rounded ${category === cat.id ? 'bg-amber-600 text-white' : 'bg-stone-700 text-stone-200 hover:bg-stone-600'}`}
                                        onClick={() => {
                                            setCategory(cat.id);
                                            if (cat.id === 'unit') setSelectedItem(allUnits[0]?.id || null);
                                            else if (cat.id === 'building') setSelectedItem(allBuildings[0]?.id || null);
                                            else if (cat.id === 'technology') setSelectedItem(allTechnologies[0]?.id || null);
                                            else if (cat.id === 'resource') setSelectedItem(ALL_RESOURCE_IDS[0] || null);
                                            else if (cat.id === 'terrain') setSelectedItem(ALL_TERRAIN_TYPES[0] || null);
                                        }}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3">
                            {category === 'unit' && allUnits.map(item => (
                                <button key={item.id} className={`w-full text-left p-2 text-xs rounded flex items-center mb-1 ${selectedItem === item.id ? 'bg-amber-700 text-white' : 'hover:bg-stone-700/50 text-stone-200'}`} onClick={() => setSelectedItem(item.id)}>
                                    <span className="mr-2 text-base">{item.icon || '👤'}</span><span>{item.type}</span>
                                </button>
                            ))}
                            {category === 'building' && allBuildings.map(item => (
                                <button key={item.id} className={`w-full text-left p-2 text-xs rounded flex items-center mb-1 ${selectedItem === item.id ? 'bg-amber-700 text-white' : 'hover:bg-stone-700/50 text-stone-200'}`} onClick={() => setSelectedItem(item.id)}>
                                    <span className="mr-2 text-base">{item.icon || '🏛️'}</span><span>{item.name}</span>
                                </button>
                            ))}
                            {category === 'technology' && allTechnologies.map(item => (
                                <button key={item.id} className={`w-full text-left p-2 text-xs rounded flex items-center mb-1 ${selectedItem === item.id ? 'bg-amber-700 text-white' : 'hover:bg-stone-700/50 text-stone-200'}`} onClick={() => setSelectedItem(item.id)}>
                                    <span className="mr-2 text-base">🔬</span><span>{item.name}</span>
                                </button>
                            ))}
                            {category === 'resource' && ALL_RESOURCE_IDS.map(resId => (
                                <button
                                    key={resId}
                                    className={`w-full text-left p-2 text-xs rounded flex items-center mb-1 ${selectedItem === resId ? 'bg-amber-700 text-white' : 'hover:bg-stone-700/50 text-stone-200'}`}
                                    onClick={() => setSelectedItem(resId)}
                                >
                                    <span className="mr-2 text-base">{RESOURCES_INFO[resId]?.icon || '💎'}</span>
                                    <span>{RESOURCES_INFO[resId]?.name || resId}</span>
                                </button>
                            ))}
                            {category === 'terrain' && ALL_TERRAIN_TYPES.map(terrainId => (
                                <button key={terrainId} className={`w-full text-left p-2 text-xs rounded flex items-center mb-1 ${selectedItem === terrainId ? 'bg-amber-700 text-white' : 'hover:bg-stone-700/50 text-stone-200'}`} onClick={() => setSelectedItem(terrainId)}>
                                    <span className="mr-2 text-base">{TERRAIN_INFO[terrainId]?.icon || '🌍'}</span><span>{TERRAIN_INFO[terrainId]?.name || terrainId}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    {renderSelectedItem()}
                </div>
            </div>
        </div>
    );
};

export default Civilopedia;