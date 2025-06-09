import React, { useRef, useEffect, useState } from 'react';
// import { calculatePath } from '../utils/gameLogic'; // Пока не используем

const HEX_SIZE = 40; // Увеличенный размер для лучшей кликабельности
const HEX_WIDTH = HEX_SIZE * Math.sqrt(3);
const HEX_HEIGHT = HEX_SIZE * 2;
const HEX_VERT_DIST = HEX_HEIGHT * 0.75;

const COLORS = {
    water: '#1e40af', // Синий
    grass: '#16a34a', // Зеленый
    forest: '#166534', // Темно-зеленый
    mountain: '#57534e', // Серый
    desert: '#ca8a04', // Желтый
    fog: '#374151' // Темно-серый для тумана войны
};

const GameMap = ({ gameState, onTileClick, onMoveViewport }) => {
    const canvasRef = useRef(null);
    const { map, units, cities, viewportPosition, selectedTile, possibleMoves, selectedUnitId } = gameState || {};

    const [isDragging, setIsDragging] = useState(false);
    const [lastDragPosition, setLastDragPosition] = useState(null);
    const [hoveredTile, setHoveredTile] = useState(null);
    const [hoverPath, setHoverPath] = useState([]); // Для пути юнита

    const drawHexagon = (ctx, x, y, size, fillStyle, strokeStyle = 'rgba(255, 255, 255, 0.2)') => {
        const angle = Math.PI / 3;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const pointX = x + size * Math.cos(angle * i);
            const pointY = y + size * Math.sin(angle * i);
            if (i === 0) ctx.moveTo(pointX, pointY);
            else ctx.lineTo(pointX, pointY);
        }
        ctx.closePath();
        if (fillStyle) {
            ctx.fillStyle = fillStyle;
            ctx.fill();
        }
        if (strokeStyle) {
            ctx.strokeStyle = strokeStyle;
            ctx.stroke();
        }
    };

    const tileToScreen = (tx, ty, vpX, vpY, startX, startY) => {
        const isEvenRow = ty % 2 === 0;
        const screenX = (tx - startX) * HEX_WIDTH + (isEvenRow ? 0 : HEX_WIDTH / 2);
        const screenY = (ty - startY) * HEX_VERT_DIST;
        return { screenX, screenY };
    };

    const pointInHexagon = (px, py, hx, hy, size = HEX_SIZE) => {
        const vertices = [];
        const angle = Math.PI / 3;
        for (let i = 0; i < 6; i++) {
            vertices.push({
                x: hx + size * Math.cos(angle * i),
                y: hy + size * Math.sin(angle * i)
            });
        }
        let inside = false;
        for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
            const xi = vertices[i].x, yi = vertices[i].y;
            const xj = vertices[j].x, yj = vertices[j].y;
            const intersect = ((yi > py) !== (yj > py)) &&
                (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    };

    const screenToTile = (screenX, screenY, vpX, vpY, startMapX, startMapY) => {
        const canvas = canvasRef.current;
        if (!canvas || !map || !map.length) return { tileX: 0, tileY: 0 };

        const visibleTilesX = Math.ceil(canvas.width / HEX_WIDTH) + 4;
        const visibleTilesY = Math.ceil(canvas.height / HEX_VERT_DIST) + 4;

        for (let yOffset = 0; yOffset < visibleTilesY; yOffset++) {
            const currentMapY = startMapY + yOffset;
            if (currentMapY < 0 || currentMapY >= map.length) continue;

            for (let xOffset = 0; xOffset < visibleTilesX; xOffset++) {
                const currentMapX = startMapX + xOffset;
                if (currentMapX < 0 || currentMapX >= map[0].length) continue;

                const { screenX: hexScreenX, screenY: hexScreenY } = tileToScreen(currentMapX, currentMapY, vpX, vpY, startMapX, startMapY);
                const centerX = hexScreenX + HEX_SIZE;
                const centerY = hexScreenY + HEX_SIZE;

                if (pointInHexagon(screenX, screenY, centerX, centerY)) {
                    return { tileX: currentMapX, tileY: currentMapY };
                }
            }
        }
        // Если точный гекс не найден, возвращаем ближайший (упрощенная логика)
        const approxRow = Math.floor(screenY / HEX_VERT_DIST);
        const isEvenRow = approxRow % 2 === 0;
        const approxCol = isEvenRow ? Math.floor(screenX / HEX_WIDTH) : Math.floor((screenX - HEX_WIDTH / 2) / HEX_WIDTH);
        return { tileX: approxCol + startMapX, tileY: approxRow + startMapY };
    };

    const isTileDiscovered = (currentMap, x, y) => {
        return currentMap && currentMap[y] !== undefined && currentMap[y][x] !== undefined && currentMap[y][x].discovered === true;
    };

    // Определяем путь от selectedUnit до hoveredTile через доступные клетки
    const calculatePathToHoveredTile = (selectedUnit, possibleMoveTiles, targetX, targetY) => {
        if (!selectedUnit || !possibleMoveTiles || possibleMoveTiles.length === 0) {
            return [];
        }

        // Если целевая клетка не в списке доступных, возвращаем пустой путь
        const targetTileMove = possibleMoveTiles.find(move => move.x === targetX && move.y === targetY);
        if (!targetTileMove) return [];

        // Используем определение родительских клеток для составления пути (breadth-first search)
        const queue = [{ x: selectedUnit.x, y: selectedUnit.y, path: [] }];
        const visited = new Set([`${selectedUnit.x},${selectedUnit.y}`]);

        while (queue.length > 0) {
            const current = queue.shift();

            if (current.x === targetX && current.y === targetY) {
                return [...current.path, { x: targetX, y: targetY }];
            }

            // Получаем координаты соседних клеток (упрощенно)
            const directions = [
                { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
                { dx: 1, dy: -1 }, { dx: -1, dy: 1 },
                { dx: 1, dy: 1 }, { dx: -1, dy: -1 }
            ];

            for (const dir of directions) {
                const newX = current.x + dir.dx;
                const newY = current.y + dir.dy;
                const newKey = `${newX},${newY}`;

                if (!visited.has(newKey) && possibleMoveTiles.some(move => move.x === newX && move.y === newY)) {
                    visited.add(newKey);
                    queue.push({
                        x: newX,
                        y: newY,
                        path: [...current.path, { x: current.x, y: current.y }]
                    });
                }
            }
        }

        return [];
    };

    useEffect(() => {
        if (!map || !map.length || !map[0] || !map[0].length) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const vpX = viewportPosition?.x || 0;
        const vpY = viewportPosition?.y || 0;

        const visibleTilesX = Math.ceil(canvas.width / HEX_WIDTH) + 2;
        const visibleTilesY = Math.ceil(canvas.height / HEX_VERT_DIST) + 2;
        const startX = Math.max(0, Math.floor(vpX - visibleTilesX / 2));
        const startY = Math.max(0, Math.floor(vpY - visibleTilesY / 2));
        const endX = Math.min(map[0].length - 1, startX + visibleTilesX -1);
        const endY = Math.min(map.length - 1, startY + visibleTilesY -1);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Рисуем основу карты
        for (let y = startY; y <= endY; y++) {
            if (!map[y]) continue;
            for (let x = startX; x <= endX; x++) {
                if (!map[y][x]) continue;
                const tile = map[y][x];
                const { screenX, screenY } = tileToScreen(x, y, vpX, vpY, startX, startY);
                const centerX = screenX + HEX_SIZE;
                const centerY = screenY + HEX_SIZE;
                let fillColor = tile.discovered ? (COLORS[tile.type] || '#333') : COLORS.fog;

                drawHexagon(ctx, centerX, centerY, HEX_SIZE, fillColor);

                if (tile.discovered && tile.resource) {
                    ctx.font = '14px Arial'; ctx.fillStyle = 'white'; ctx.textAlign = 'center';
                    const resourceIcon =
                        tile.resource === 'fish' ? '🐟' :
                            tile.resource === 'shellfish' ? '🦪' :
                                tile.resource === 'fruits' ? '🍎' :
                                    tile.resource === 'iron' ? '⚒️' :
                                        tile.resource === 'gold_ore' ? '💰' :
                                            tile.resource === 'cotton' ? '🧵' :
                                                tile.resource === 'deer' ? '🦌' : '💎';
                    ctx.fillText(resourceIcon, centerX, centerY + 5);
                }
            }
        }

        // Отрисовка территории городов
        if (cities && cities.length) {
            cities.forEach(city => {
                if (!city || typeof city.x !== 'number' || typeof city.y !== 'number') return;

                const workableTiles = city.workableTiles || []; // Используем сохраненные или вычисляем заново (если нет)

                workableTiles.forEach(workableTile => {
                    if (!map[workableTile.y] || !map[workableTile.y][workableTile.x] || !map[workableTile.y][workableTile.x].discovered) return;

                    const { screenX:_screenX, screenY:_screenY } = tileToScreen(workableTile.x, workableTile.y, vpX, vpY, startX, startY);
                    const tileCenterX = _screenX + HEX_SIZE;
                    const tileCenterY = _screenY + HEX_SIZE;

                    ctx.lineWidth = 1;
                    ctx.strokeStyle = city.owner === 'player' ? 'rgba(252, 211, 77, 0.4)' : city.owner === 'red' ? 'rgba(220, 38, 38, 0.4)' : city.owner === 'blue' ? 'rgba(37, 99, 235, 0.4)' : 'rgba(21, 128, 61, 0.4)';
                    drawHexagon(ctx, tileCenterX, tileCenterY, HEX_SIZE, null, ctx.strokeStyle);

                    const isWorked = city.workingTiles && city.workingTiles.some(t => t.x === workableTile.x && t.y === workableTile.y);
                    if (isWorked && city.owner === 'player') {
                        ctx.fillStyle = 'rgba(252, 211, 77, 0.2)';
                        drawHexagon(ctx, tileCenterX, tileCenterY, HEX_SIZE * 0.8, ctx.fillStyle, null);
                        ctx.font = '10px Arial'; ctx.fillStyle = 'white'; ctx.textAlign = 'center';
                        // ctx.fillText('👤', tileCenterX, tileCenterY - HEX_SIZE * 0.3); // Пока уберем значок рабочего для чистоты
                    }
                });
            });
        }

        // Отрисовка возможных ходов для юнита
        if (possibleMoves && possibleMoves.length > 0) {
            possibleMoves.forEach(move => {
                if (!map[move.y] || !map[move.y][move.x] || !map[move.y][move.x].discovered) return;

                const { screenX, screenY } = tileToScreen(move.x, move.y, vpX, vpY, startX, startY);
                const centerX = screenX + HEX_SIZE;
                const centerY = screenY + HEX_SIZE;

                // Определяем цвет подсветки в зависимости от доступности хода
                let highlightColor;
                const selectedUnit = units.find(u => u.id === selectedUnitId);

                if (selectedUnit && move.movesLeftAfterMove > 0) {
                    // Клетка доступна для перемещения в текущем ходу с сохранением ходов
                    highlightColor = 'rgba(0, 255, 0, 0.3)'; // зеленый
                } else if (selectedUnitId && gameState.attackingUnit === selectedUnitId) {
                    // Клетки для атаки
                    highlightColor = 'rgba(255, 0, 0, 0.3)'; // красный
                } else {
                    // Клетка доступна, но у юнита закончатся ходы
                    highlightColor = 'rgba(255, 255, 0, 0.3)'; // желтый
                }

                ctx.globalAlpha = 0.7;
                drawHexagon(ctx, centerX, centerY, HEX_SIZE * 0.85, highlightColor);
                ctx.globalAlpha = 1.0;
            });
        }

        // Отрисовка пути при наведении
        if (hoveredTile && selectedUnitId && possibleMoves && possibleMoves.length > 0) {
            const selectedUnit = units.find(u => u.id === selectedUnitId);
            if (selectedUnit) {
                // Используем метод для расчета пути от selectedUnit до hoveredTile
                const path = calculatePathToHoveredTile(
                    selectedUnit,
                    possibleMoves,
                    hoveredTile.x,
                    hoveredTile.y
                );

                if (path.length > 0) {
                    // Рисуем линии пути
                    ctx.beginPath();
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';

                    for (let i = 0; i < path.length; i++) {
                        const { screenX, screenY } = tileToScreen(path[i].x, path[i].y, vpX, vpY, startX, startY);
                        const centerX = screenX + HEX_SIZE;
                        const centerY = screenY + HEX_SIZE;

                        if (i === 0) {
                            ctx.moveTo(centerX, centerY);
                        } else {
                            ctx.lineTo(centerX, centerY);
                        }
                    }

                    ctx.stroke();

                    // Добавляем точки на пути
                    for (let i = 0; i < path.length; i++) {
                        const { screenX, screenY } = tileToScreen(path[i].x, path[i].y, vpX, vpY, startX, startY);
                        const centerX = screenX + HEX_SIZE;
                        const centerY = screenY + HEX_SIZE;

                        ctx.fillStyle = i === 0 ? 'rgba(255, 255, 255, 0.9)' :
                            i === path.length - 1 ? 'rgba(255, 255, 255, 0.9)' :
                                'rgba(255, 255, 255, 0.5)';
                        ctx.beginPath();
                        ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
        }

        if (selectedTile && map[selectedTile.y] && map[selectedTile.y][selectedTile.x]) {
            const { screenX: selScreenX, screenY: selScreenY } = tileToScreen(selectedTile.x, selectedTile.y, vpX, vpY, startX, startY);
            const selCenterX = selScreenX + HEX_SIZE;
            const selCenterY = selScreenY + HEX_SIZE;
            if (selCenterX >= 0 && selCenterX < canvas.width && selCenterY >= 0 && selCenterY < canvas.height) {
                ctx.lineWidth = 3; drawHexagon(ctx, selCenterX, selCenterY, HEX_SIZE, null, '#fcd34d'); ctx.lineWidth = 1;
            }
        }

        if (hoveredTile && map[hoveredTile.y] && map[hoveredTile.y][hoveredTile.x]) {
            const isSameAsSelected = selectedTile && selectedTile.x === hoveredTile.x && selectedTile.y === hoveredTile.y;
            if (!isSameAsSelected) {
                const { screenX:hovScreenX, screenY:hovScreenY } = tileToScreen(hoveredTile.x, hoveredTile.y, vpX, vpY, startX, startY);
                const hovCenterX = hovScreenX + HEX_SIZE;
                const hovCenterY = hovScreenY + HEX_SIZE;
                if (hovCenterX >= 0 && hovCenterX < canvas.width && hovCenterY >= 0 && hovCenterY < canvas.height) {
                    ctx.lineWidth = 2; drawHexagon(ctx, hovCenterX, hovCenterY, HEX_SIZE, null, 'rgba(255, 255, 255, 0.5)'); ctx.lineWidth = 1;
                }
            }
        }

        if (cities && cities.length) {
            cities.forEach(city => {
                if (!city || typeof city.x !== 'number' || typeof city.y !== 'number' || !isTileDiscovered(map, city.x, city.y)) return;
                const { screenX: cityScreenX, screenY: cityScreenY } = tileToScreen(city.x, city.y, vpX, vpY, startX, startY);
                const cityCenterX = cityScreenX + HEX_SIZE;
                const cityCenterY = cityScreenY + HEX_SIZE;

                if (cityCenterX >= -HEX_SIZE && cityCenterX <= canvas.width + HEX_SIZE && cityCenterY >= -HEX_SIZE && cityCenterY <= canvas.height + HEX_SIZE) {
                    ctx.fillStyle = city.owner === 'player' ? '#fcd34d' : city.owner === 'red' ? '#dc2626' : city.owner === 'blue' ? '#2563eb' : '#15803d';
                    ctx.beginPath(); ctx.arc(cityCenterX, cityCenterY, HEX_SIZE / 2, 0, Math.PI * 2); ctx.fill();
                    ctx.lineWidth = 3; ctx.strokeStyle = 'white'; ctx.beginPath(); ctx.arc(cityCenterX, cityCenterY, HEX_SIZE / 1.8, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1;
                    ctx.font = '22px Arial'; ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.fillText('🏙️', cityCenterX, cityCenterY + 8);
                    ctx.font = '12px Arial'; ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.fillText(city.name || 'Город', cityCenterX, cityCenterY - 25);
                    ctx.font = '11px Arial'; ctx.fillStyle = 'white'; ctx.strokeStyle = 'black'; ctx.lineWidth = 3; ctx.textAlign = 'center';
                    ctx.strokeText(`${city.population || 1}`, cityCenterX, cityCenterY + 25);
                    ctx.fillText(`${city.population || 1}`, cityCenterX, cityCenterY + 25);
                }
            });
        }

        if (units && units.length) {
            units.forEach(unit => {
                if (!unit || typeof unit.x !== 'number' || typeof unit.y !== 'number' || !isTileDiscovered(map, unit.x, unit.y)) return;
                const { screenX: unitScreenX, screenY: unitScreenY } = tileToScreen(unit.x, unit.y, vpX, vpY, startX, startY);
                const unitCenterX = unitScreenX + HEX_SIZE;
                const unitCenterY = unitScreenY + HEX_SIZE;

                if (unitCenterX >= -HEX_SIZE && unitCenterX <= canvas.width + HEX_SIZE && unitCenterY >= -HEX_SIZE && unitCenterY <= canvas.height + HEX_SIZE) {
                    // Выделение выбранного юнита
                    if (selectedUnitId === unit.id) {
                        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
                        ctx.beginPath();
                        ctx.arc(unitCenterX, unitCenterY, HEX_SIZE / 1.5, 0, Math.PI * 2);
                        ctx.fill();
                    }

                    ctx.fillStyle = unit.owner === 'player' ? 'rgba(252, 211, 77, 0.6)' : unit.owner === 'barbarians' ? 'rgba(153, 27, 27, 0.7)' : unit.owner === 'red' ? 'rgba(220, 38, 38, 0.6)' : unit.owner === 'blue' ? 'rgba(37, 99, 235, 0.6)' : 'rgba(21, 128, 61, 0.6)';
                    ctx.beginPath(); ctx.arc(unitCenterX, unitCenterY, HEX_SIZE / 2.5, 0, Math.PI * 2); ctx.fill();
                    ctx.strokeStyle = unit.owner === 'player' ? '#fcd34d' : unit.owner === 'barbarians' ? '#991b1b' : unit.owner === 'red' ? '#dc2626' : unit.owner==='blue' ? '#2563eb' : '#15803d';
                    ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(unitCenterX, unitCenterY, HEX_SIZE / 2.5, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1;
                    ctx.font = '24px Arial'; ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.fillText(unit.icon || '👤', unitCenterX, unitCenterY + 8);
                    const healthWidth = (HEX_SIZE - 10) * ((unit.health || 0) / (unit.maxHealth || 1)); // HEX_SIZE-10 to make it smaller than base
                    ctx.fillStyle = 'rgba(40, 40, 40, 0.7)'; // Darker background for health bar
                    ctx.fillRect(unitCenterX - (HEX_SIZE - 10) / 2, unitCenterY + HEX_SIZE / 2 - 12, HEX_SIZE - 10, 5); // Adjusted position and size
                    ctx.fillStyle = (unit.health || 0) > (unit.maxHealth || 1) * 0.7 ? '#22c55e' : (unit.health || 0) > (unit.maxHealth || 1) * 0.3 ? '#f59e0b' : '#ef4444'; // Brighter red
                    ctx.fillRect(unitCenterX - (HEX_SIZE - 10) / 2, unitCenterY + HEX_SIZE / 2 - 12, healthWidth, 5);

                    if (unit.owner === 'player') {
                        const moveDotsX = unitCenterX - HEX_SIZE / 2 + 8;
                        const moveDotsY = unitCenterY - HEX_SIZE / 2 + 8;
                        for (let i = 0; i < (unit.maxMoves || 0); i++) {
                            ctx.fillStyle = i < (unit.movesLeft || 0) ? '#fcd34d' : 'rgba(252, 211, 77, 0.3)';
                            ctx.beginPath(); ctx.arc(moveDotsX + i * 6, moveDotsY, 2, 0, Math.PI * 2); ctx.fill();
                        }
                    }
                }
            });
        }
    }, [gameState, map, units, cities, viewportPosition, selectedTile, possibleMoves, hoveredTile, hoverPath, selectedUnitId]);

    const handleCanvasClick = (e) => {
        if (!gameState || !gameState.map || !gameState.map[0]) return;
        const canvas = canvasRef.current; if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        const vpX = gameState.viewportPosition?.x || 0;
        const vpY = gameState.viewportPosition?.y || 0;
        const visibleTilesX = Math.ceil(canvas.width / HEX_WIDTH) + 2;
        const visibleTilesY = Math.ceil(canvas.height / HEX_VERT_DIST) + 2;
        const startX = Math.max(0, Math.floor(vpX - visibleTilesX / 2));
        const startY = Math.max(0, Math.floor(vpY - visibleTilesY / 2));
        try {
            const { tileX, tileY } = screenToTile(canvasX, canvasY, vpX, vpY, startX, startY);
            const x = Math.floor(tileX);
            const y = Math.floor(tileY);
            if (x >= 0 && x < gameState.map[0].length && y >= 0 && y < gameState.map.length) {
                onTileClick(x, y);
            }
        } catch (error) { console.error("Ошибка при определении координат клика:", error); }
    };

    const handleMouseDown = (e) => {
        if (e.button === 0) {
            e.preventDefault(); setIsDragging(true); setLastDragPosition({ x: e.clientX, y: e.clientY });
            const canvas = canvasRef.current; if (canvas) canvas.style.cursor = 'grabbing';
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging && lastDragPosition && map && map[0]) {
            try {
                const dx = (lastDragPosition.x - e.clientX) / 30;
                const dy = (lastDragPosition.y - e.clientY) / 30;
                const newVpX = Math.max(0, Math.min(map[0].length - 1, Math.round((viewportPosition?.x || 0) + dx)));
                const newVpY = Math.max(0, Math.min(map.length - 1, Math.round((viewportPosition?.y || 0) + dy)));
                onMoveViewport({ x: newVpX, y: newVpY });
                setLastDragPosition({ x: e.clientX, y: e.clientY });
            } catch (error) {
                console.error("Ошибка при перетаскивании карты:", error);
                setIsDragging(false); setLastDragPosition(null);
            }
        }
    };

    const handleMouseMoveForHover = (e) => {
        if (isDragging) return;
        const canvas = canvasRef.current; if (!canvas || !map || !map[0]) return;
        const rect = canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        const vpX = viewportPosition?.x || 0;
        const vpY = viewportPosition?.y || 0;
        const visibleTilesX = Math.ceil(canvas.width / HEX_WIDTH) + 2;
        const visibleTilesY = Math.ceil(canvas.height / HEX_VERT_DIST) + 2;
        const startX = Math.max(0, Math.floor(vpX - visibleTilesX / 2));
        const startY = Math.max(0, Math.floor(vpY - visibleTilesY / 2));
        try {
            const { tileX, tileY } = screenToTile(canvasX, canvasY, vpX, vpY, startX, startY);
            const x = Math.floor(tileX);
            const y = Math.floor(tileY);
            if (x >= 0 && x < map[0].length && y >= 0 && y < map.length) {
                setHoveredTile({ x, y });

                // Обновляем путь для юнита при наведении на клетку
                if (selectedUnitId && possibleMoves && possibleMoves.length > 0) {
                    const selectedUnit = units.find(u => u.id === selectedUnitId);
                    if (selectedUnit) {
                        const path = calculatePathToHoveredTile(
                            selectedUnit,
                            possibleMoves,
                            x,
                            y
                        );
                        setHoverPath(path);
                    }
                }
            } else {
                setHoveredTile(null);
                setHoverPath([]);
            }
        } catch (error) {
            setHoveredTile(null);
            setHoverPath([]);
        }
    };

    const handleMouseUp = () => {
        if (isDragging) {
            setIsDragging(false); setLastDragPosition(null);
            const canvas = canvasRef.current; if (canvas) canvas.style.cursor = 'pointer';
        }
    };

    const handleWheel = (e) => {
        if (!map || !map[0]) return;
        const direction = e.deltaY > 0 ? 1 : -1;
        const dx = direction * 1; const dy = direction * 1;
        const newVpX = Math.max(0, Math.min(map[0].length - 1, (viewportPosition?.x || 0) + dx));
        const newVpY = Math.max(0, Math.min(map.length - 1, (viewportPosition?.y || 0) + dy));
        onMoveViewport({ x: newVpX, y: newVpY });
        e.preventDefault();
    };

    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const handleContextMenu = (e) => e.preventDefault();
        canvas.addEventListener('click', handleCanvasClick);
        canvas.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('wheel', handleWheel, { passive: false });
        canvas.addEventListener('contextmenu', handleContextMenu);
        canvas.addEventListener('mousemove', handleMouseMoveForHover);

        return () => {
            canvas.removeEventListener('click', handleCanvasClick);
            canvas.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('wheel', handleWheel);
            canvas.removeEventListener('contextmenu', handleContextMenu);
            canvas.removeEventListener('mousemove', handleMouseMoveForHover);
        };
    }, [gameState, isDragging, lastDragPosition, map, viewportPosition, onTileClick, onMoveViewport, possibleMoves, selectedUnitId, units]);

    return (
        <div className="absolute inset-0 overflow-hidden">
            <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} className="bg-gray-900 cursor-pointer" />
            <Minimap gameState={gameState} onMinimapClick={(coords) => { if (coords && typeof coords.x === 'number' && typeof coords.y === 'number') { onMoveViewport({ x: Math.floor(coords.x), y: Math.floor(coords.y) }); } }} />
            <div className="absolute bottom-16 left-4 text-white bg-black/50 px-3 py-1 rounded text-sm">Перемещение камеры: зажмите левую кнопку мыши и двигайте</div>
        </div>
    );
};

const Minimap = ({ gameState, onMinimapClick }) => {
    const canvasRef = useRef(null);
    const { map, viewportPosition, units, cities } = gameState || {};

    useEffect(() => {
        if (!map || !map.length || !map[0] || !map[0].length) return;
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const miniTileSize = 2;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let y = 0; y < map.length; y++) {
            if (!map[y]) continue;
            for (let x = 0; x < map[y].length; x++) {
                if (!map[y][x]) continue;
                const isEvenRow = y % 2 === 0;
                const miniX = x * miniTileSize + (isEvenRow ? 0 : miniTileSize / 2);
                const miniY = y * miniTileSize * 0.75;
                ctx.fillStyle = map[y][x].discovered ? (COLORS[map[y][x].type] || '#333') : COLORS.fog;
                ctx.beginPath(); ctx.arc(miniX + miniTileSize / 2, miniY + miniTileSize / 2, miniTileSize / 1.8, 0, Math.PI * 2); ctx.fill(); // чуть меньше гекс
            }
        }

        if (cities && cities.length) {
            cities.forEach(city => {
                if (!city || typeof city.x !== 'number' || typeof city.y !== 'number' || !map[city.y] || !map[city.y][city.x] || !map[city.y][city.x].discovered) return;
                const isEvenRow = city.y % 2 === 0;
                const miniX = city.x * miniTileSize + (isEvenRow ? 0 : miniTileSize / 2);
                const miniY = city.y * miniTileSize * 0.75;
                ctx.fillStyle = city.owner === 'player' ? '#fcd34d' : city.owner === 'red' ? '#dc2626' : city.owner === 'blue' ? '#2563eb' : '#15803d';
                ctx.beginPath(); ctx.arc(miniX + miniTileSize / 2, miniY + miniTileSize / 2, miniTileSize * 0.8, 0, Math.PI * 2); ctx.fill(); // Размер города на миникарте
            });
        }

        if (units && units.length) {
            units.filter(u => u && u.owner === 'player').forEach(unit => {
                if (!unit || typeof unit.x !== 'number' || typeof unit.y !== 'number' || !map[unit.y] || !map[unit.y][unit.x] || !map[unit.y][unit.x].discovered) return;
                const isEvenRow = unit.y % 2 === 0;
                const miniX = unit.x * miniTileSize + (isEvenRow ? 0 : miniTileSize / 2);
                const miniY = unit.y * miniTileSize * 0.75;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath(); ctx.arc(miniX + miniTileSize / 2, miniY + miniTileSize / 2, miniTileSize / 2.5, 0, Math.PI * 2); ctx.fill(); // Размер юнита
            });
        }

        if (viewportPosition) {
            const vpX = viewportPosition.x || 0;
            const vpY = viewportPosition.y || 0;
            const canvasWidthForTiles = canvasRef.current ? canvasRef.current.parentElement.querySelector('canvas:not(#minimap-canvas)')?.width || window.innerWidth : window.innerWidth;
            const canvasHeightForTiles = canvasRef.current ? canvasRef.current.parentElement.querySelector('canvas:not(#minimap-canvas)')?.height || window.innerHeight : window.innerHeight;

            const visibleTilesX = Math.ceil(canvasWidthForTiles / HEX_WIDTH);
            const visibleTilesY = Math.ceil(canvasHeightForTiles / HEX_VERT_DIST);

            const rectX = (vpX - visibleTilesX / 2) * miniTileSize + ((vpY%2===0) ? 0 : miniTileSize/2) ;
            const rectY = (vpY - visibleTilesY / 2 ) * miniTileSize * 0.75;
            const rectWidth = visibleTilesX * miniTileSize;
            const rectHeight = visibleTilesY * miniTileSize * 0.75;

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 0.5; // Тоньше рамка
            ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
        }
    }, [map, viewportPosition, units, cities]);

    const handleMinimapClick = (e) => {
        if (!map || !map.length || !map[0]) return;
        const canvas = canvasRef.current; if (!canvas) return;
        try {
            const rect = canvas.getBoundingClientRect();
            const miniTileSize = 2;
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            const tileY = Math.floor(clickY / (miniTileSize * 0.75));
            const isEvenRow = tileY % 2 === 0;
            const tileX = Math.floor((clickX - (isEvenRow ? 0 : miniTileSize / 2)) / miniTileSize);
            if (tileX >= 0 && tileX < map[0].length && tileY >= 0 && tileY < map.length) {
                onMinimapClick({ x: Math.floor(tileX), y: Math.floor(tileY) });
            }
        } catch (error) { console.error("Ошибка при клике по мини-карте:", error); }
    };

    return (
        <div className="absolute bottom-16 right-4 border border-amber-600/70 bg-stone-800/80 rounded shadow-md">
            <canvas
                id="minimap-canvas" // Добавим ID для возможного исключения из запросов выше
                ref={canvasRef}
                width={map && map[0] ? map[0].length * 2 + 2 : 200} // +2 для небольшого отступа
                height={map ? map.length * 2 * 0.75 + 2 : 150}
                onClick={handleMinimapClick}
                className="cursor-pointer"
            />
        </div>
    );
};

export default GameMap;