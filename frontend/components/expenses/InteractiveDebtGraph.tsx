import React, { useState, useEffect, useRef } from 'react';
import { Move, ZoomIn } from 'lucide-react';
import { User } from '../../types';
import { GRAPH_CONFIG } from '../../utils/constants';

interface Balance {
  from: string;
  to: string;
  amount: number;
}

interface InteractiveDebtGraphProps {
  users: User[];
  balances: Balance[];
}

export const InteractiveDebtGraph: React.FC<InteractiveDebtGraphProps> = ({ users, balances }) => {
  if (users.length === 0) return null;

  const { width, height, nodeRadius: r, minZoom, maxZoom, zoomSpeed } = GRAPH_CONFIG;
  const cx = width / 2;
  const cy = height / 2;

  // State to track positions of nodes
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize positions in a circle on mount
  useEffect(() => {
    const newPos: Record<string, { x: number; y: number }> = {};
    users.forEach((user, i) => {
      const angle = (2 * Math.PI * i) / users.length - Math.PI / 2;
      newPos[user.id] = {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle)
      };
    });
    setPositions(newPos);
  }, [users, cx, cy, r]);

  // Handle Zoom via Ctrl + Scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = -e.deltaY * zoomSpeed;
        setZoom(prev => Math.min(Math.max(minZoom, prev + delta), maxZoom));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [minZoom, maxZoom, zoomSpeed]);

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent, userId: string) => {
    e.preventDefault();
    setDraggingId(userId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !svgRef.current) return;

    // Get SVG coordinate conversion
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return;

    const x = (e.clientX - CTM.e) / CTM.a;
    const y = (e.clientY - CTM.f) / CTM.d;

    setPositions(prev => ({
      ...prev,
      [draggingId]: { x, y }
    }));
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  // Calculate ViewBox based on zoom
  const vbW = width / zoom;
  const vbH = height / zoom;
  const vbX = (width - vbW) / 2;
  const vbY = (height - vbH) / 2;

  return (
    <div
      ref={containerRef}
      className="w-full flex justify-center mb-4 overflow-hidden bg-gray-50/50 rounded-xl border border-gray-100 relative"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="absolute top-2 right-2 text-xs text-gray-400 flex flex-col items-end gap-1 pointer-events-none select-none z-10">
        <div className="flex items-center gap-1"><Move className="w-3 h-3" /> Drag to arrange</div>
        <div className="flex items-center gap-1"><ZoomIn className="w-3 h-3" /> Ctrl + Scroll to zoom</div>
      </div>
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        className="max-w-[500px] select-none cursor-default"
      >
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="18" refY="5"
              markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#9ca3af" />
          </marker>

          {users.map(u => (
            <pattern id={`avatar-${u.id}`} key={u.id} height="100%" width="100%" patternContentUnits="objectBoundingBox">
               <rect width="1" height="1" fill="#e5e7eb"/>
               <image href={u.avatar} x="0" y="0" width="1" height="1" preserveAspectRatio="xMidYMid slice" />
            </pattern>
          ))}
        </defs>

        {/* Edges (Debts) */}
        {balances.map((b, i) => {
            const start = positions[b.from];
            const end = positions[b.to];
            if(!start || !end) return null;

            // Calculate shortened line
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            // Padding for node radius (25) + arrow space
            const offsetStart = 30;
            const offsetEnd = 30;

            if (dist < offsetStart + offsetEnd) return null;

            const x1 = start.x + (dx * offsetStart) / dist;
            const y1 = start.y + (dy * offsetStart) / dist;
            const x2 = end.x - (dx * offsetEnd) / dist;
            const y2 = end.y - (dy * offsetEnd) / dist;

            const midX = (start.x + end.x) / 2;
            const midY = (start.y + end.y) / 2;

            return (
                <g key={i}>
                    {/* Connection Line */}
                    <path d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke="#9ca3af" strokeWidth="2" markerEnd="url(#arrow)" />

                    {/* Amount Label */}
                    <rect x={midX - 24} y={midY - 12} width="48" height="24" rx="12" fill="white" stroke="#e5e7eb" className="shadow-sm" />
                    <text x={midX} y={midY} dy="4" textAnchor="middle" fontSize="11" fill="#4b5563" fontWeight="bold">
                        ${Math.round(b.amount)}
                    </text>
                </g>
            )
        })}

        {/* Nodes (Users) */}
        {users.map(u => {
            const pos = positions[u.id];
            if (!pos) return null;
            const isDragging = draggingId === u.id;

            return (
                <g
                  key={u.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onMouseDown={(e) => handleMouseDown(e, u.id)}
                  style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                  className="transition-transform duration-75"
                >
                    {/* Halo effect when dragging */}
                    {isDragging && <circle r="30" fill="rgba(45, 212, 191, 0.2)" />}

                    {/* Border Circle */}
                    <circle r="24" fill="white" stroke={isDragging ? '#2dd4bf' : '#e5e7eb'} strokeWidth={isDragging ? 3 : 2} />

                    {/* Avatar Circle */}
                    <circle r="20" fill={`url(#avatar-${u.id})`} />

                    {/* Name Label */}
                    <text y="40" textAnchor="middle" className="text-xs font-bold fill-gray-700 pointer-events-none select-none" style={{ textShadow: "0px 2px 4px rgba(255,255,255,1)" }}>
                        {u.name.split(' ')[0]}
                    </text>
                </g>
            );
        })}
      </svg>
    </div>
  );
};
