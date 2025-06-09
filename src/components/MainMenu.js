import React, { useState, useEffect } from 'react';

const MainMenu = ({ onStartNewGame, onLoadGame }) => {
    const [savedGames, setSavedGames] = useState([]);
    const [showLoadWindow, setShowLoadWindow] = useState(false);

    useEffect(() => {
        // Загружаем список сохраненных игр при монтировании компонента
        loadSavedGamesList();
    }, []);

    const loadSavedGamesList = () => {
        try {
            const savedGamesKeys = Object.keys(localStorage).filter(key => key.startsWith('civ_save_'));
            let gamesList = [];

            savedGamesKeys.forEach(key => {
                try {
                    const saveData = JSON.parse(localStorage.getItem(key));
                    if (saveData && saveData.meta) {
                        gamesList.push({
                            id: key,
                            name: saveData.meta.name || 'Безымянное сохранение',
                            date: saveData.meta.date || 'Дата неизвестна',
                            turn: saveData.gameState?.currentTurn || 0
                        });
                    }
                } catch (e) {
                    console.error("Ошибка при загрузке данных:", key, e);
                }
            });

            setSavedGames(gamesList.sort((a, b) => new Date(b.date) - new Date(a.date)));
        } catch (e) {
            console.error("Ошибка при загрузке списка сохранений:", e);
            setSavedGames([]);
        }
    };

    const handleLoadGame = (saveId) => {
        try {
            const saveData = JSON.parse(localStorage.getItem(saveId));
            if (saveData && saveData.gameState) {
                onLoadGame(saveData.gameState);
            } else {
                alert("Ошибка загрузки: сохранение повреждено");
            }
        } catch (e) {
            console.error("Ошибка при загрузке:", e);
            alert("Не удалось загрузить игру");
        }
    };

    const handleDeleteSave = (saveId, e) => {
        e.stopPropagation(); // Предотвращаем всплытие события

        if (window.confirm("Вы уверены, что хотите удалить это сохранение?")) {
            localStorage.removeItem(saveId);
            loadSavedGamesList(); // Обновляем список
        }
    };

    return (
        <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center p-4">
            <div className="max-w-2xl w-full text-center">
                <h1 className="text-5xl font-bold text-amber-400 mb-8 tracking-wider">4Х-Стратегия</h1>

                {!showLoadWindow ? (
                    <div className="space-y-4">
                        <button
                            className="w-full bg-amber-600 hover:bg-amber-500 text-white py-4 rounded-lg text-xl font-semibold transition-colors"
                            onClick={onStartNewGame}
                        >
                            Новая игра
                        </button>

                        <button
                            className={`w-full bg-stone-700 hover:bg-stone-600 text-white py-4 rounded-lg text-xl font-semibold transition-colors ${savedGames.length === 0 ? 'opacity-70 cursor-not-allowed' : ''}`}
                            onClick={() => setShowLoadWindow(true)}
                            disabled={savedGames.length === 0}
                        >
                            Загрузить игру {savedGames.length === 0 ? "(нет сохранений)" : `(${savedGames.length})`}
                        </button>
                    </div>
                ) : (
                    <div className="bg-stone-800 rounded-lg p-4 border border-stone-700">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl text-amber-400 font-semibold">Загрузить сохранение</h2>
                            <button
                                className="text-stone-400 hover:text-white text-2xl px-2"
                                onClick={() => setShowLoadWindow(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="max-h-[50vh] overflow-y-auto space-y-2">
                            {savedGames.length > 0 ? (
                                savedGames.map(save => (
                                    <div
                                        key={save.id}
                                        className="bg-stone-700 hover:bg-stone-600 p-3 rounded-md flex justify-between items-center cursor-pointer transition-colors"
                                        onClick={() => handleLoadGame(save.id)}
                                    >
                                        <div className="text-left">
                                            <div className="text-white font-medium">{save.name}</div>
                                            <div className="text-xs text-stone-400">
                                                Ход: {save.turn} | Дата: {new Date(save.date).toLocaleString()}
                                            </div>
                                        </div>
                                        <button
                                            className="text-red-400 hover:text-red-300 p-2"
                                            onClick={(e) => handleDeleteSave(save.id, e)}
                                            title="Удалить сохранение"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-stone-400 py-8 text-center">Нет доступных сохранений</p>
                            )}
                        </div>

                        <button
                            className="mt-4 w-full bg-stone-600 hover:bg-stone-500 text-white py-2 rounded text-sm"
                            onClick={() => setShowLoadWindow(false)}
                        >
                            Назад в меню
                        </button>
                    </div>
                )}

                <p className="text-stone-500 text-sm mt-8">© 2025 РКЧВП. Курсовой проект.</p>
            </div>
        </div>
    );
};

export default MainMenu;