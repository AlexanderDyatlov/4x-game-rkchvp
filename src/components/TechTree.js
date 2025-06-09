import React from 'react';

const TechTree = ({ technologies, currentResearch, onClose, onSelectResearch }) => {
    // Организуем технологии по эпохам
    const techByEra = {
        'Древний мир': [],
        'Классическая эпоха': [],
        'Средневековье': [],
        'Возрождение': [],
        'Индустриальная эпоха': []
    };

    // Безопасное добавление технологий
    if (technologies && technologies.length) {
        technologies.forEach(tech => {
            if (tech && tech.era && techByEra[tech.era]) {
                techByEra[tech.era].push(tech);
            }
        });
    }

    return (
        <div className="fixed inset-0 bg-stone-900/95 z-50 flex flex-col overflow-hidden">
            <div className="bg-stone-800 border-b border-amber-600 p-4 flex justify-between items-center">
                <h2 className="text-2xl text-amber-400 font-bold">Дерево технологий</h2>
                <button
                    className="px-3 py-1 bg-red-700 hover:bg-red-600 text-white rounded"
                    onClick={onClose}
                >
                    Закрыть
                </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
                {/* Рендерим технологии по эпохам */}
                {Object.entries(techByEra).map(([era, techs]) =>
                    techs.length > 0 ? (
                        <div key={era} className="mb-8">
                            <h3 className="text-xl text-white font-semibold mb-4 border-b border-amber-600 pb-2">{era}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {techs.map(tech => {
                                    const isResearched = tech.researched;
                                    const isResearching = currentResearch?.id === tech.id;
                                    const canResearch = tech.prerequisites?.every(preReqId =>
                                        technologies.find(t => t.id === preReqId)?.researched
                                    ) || tech.prerequisites?.length === 0;

                                    return (
                                        <div
                                            key={tech.id}
                                            className={`
                                                p-4 rounded border-2 transition-colors
                                                ${isResearched ? 'bg-green-900/30 border-green-600' :
                                                isResearching ? 'bg-amber-900/30 border-amber-600' :
                                                    canResearch ? 'bg-stone-800 border-stone-600 hover:border-amber-600 cursor-pointer' :
                                                        'bg-stone-800/50 border-stone-700 opacity-70'}
                                            `}
                                            onClick={() => canResearch && !isResearched && !isResearching && onSelectResearch && onSelectResearch(tech)}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <h4 className="text-amber-400 font-medium">{tech.name}</h4>
                                                <div className="text-white text-sm">
                                                    {isResearched ? (
                                                        <span className="bg-green-800 px-2 py-0.5 rounded">Исследовано</span>
                                                    ) : (
                                                        <span>🔬 {tech.cost}</span>
                                                    )}
                                                </div>
                                            </div>

                                            <p className="text-white text-sm mb-3">{tech.description}</p>

                                            {/* Предпосылки */}
                                            {tech.prerequisites && tech.prerequisites.length > 0 && (
                                                <div className="mt-2 mb-3">
                                                    <h5 className="text-xs text-stone-400 mb-1">Требуется:</h5>
                                                    <div className="flex flex-wrap gap-1">
                                                        {tech.prerequisites.map(preReqId => {
                                                            const preReqTech = technologies.find(t => t.id === preReqId);
                                                            const isPreReqResearched = preReqTech?.researched;

                                                            return (
                                                                <span
                                                                    key={preReqId}
                                                                    className={`
                                                                        text-xs px-2 py-1 rounded
                                                                        ${isPreReqResearched ? 'bg-green-800 text-white' : 'bg-stone-700 text-stone-300'}
                                                                    `}
                                                                >
                                                                    {preReqTech?.name || preReqId}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Что открывает */}
                                            {tech.unlocks && tech.unlocks.length > 0 && (
                                                <div className="mt-2">
                                                    <h5 className="text-xs text-amber-400 mb-1">Открывает:</h5>
                                                    <div className="flex flex-wrap gap-1">
                                                        {tech.unlocks.map(item => (
                                                            <span
                                                                key={item}
                                                                className="text-xs bg-amber-800/50 text-amber-200 px-2 py-1 rounded"
                                                            >
                                                                {item}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Индикатор прогресса исследования */}
                                            {isResearching && (
                                                <div className="mt-3">
                                                    <div className="flex justify-between text-xs text-white mb-1">
                                                        <span>Прогресс:</span>
                                                        <span>{currentResearch.progress} / {currentResearch.cost}</span>
                                                    </div>
                                                    <div className="h-2 bg-stone-700 rounded overflow-hidden">
                                                        <div
                                                            className="h-full bg-amber-500"
                                                            style={{ width: `${(currentResearch.progress / currentResearch.cost) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : null
                )}
            </div>
        </div>
    );
};

export default TechTree;