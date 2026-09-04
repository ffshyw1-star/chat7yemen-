import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface DashboardD3ChartsProps {
  onlineCount: number;
  totalUsersCount: number;
}

export const DashboardD3Charts: React.FC<DashboardD3ChartsProps> = ({ onlineCount, totalUsersCount }) => {
  const visitorsChartRef = useRef<SVGSVGElement | null>(null);
  const roomsChartRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!visitorsChartRef.current) return;

    // Clear previous SVG
    d3.select(visitorsChartRef.current).selectAll('*').remove();

    const width = 450;
    const height = 220;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    const svg = d3.select(visitorsChartRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // 24 hours sample data for online visitors
    const data = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      visitors: Math.floor(Math.max(5, onlineCount * (0.4 + 0.6 * Math.sin(i / 3) + Math.random() * 0.3)))
    }));

    const x = d3.scalePoint()
      .domain(data.map(d => d.hour))
      .range([0, width - margin.left - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.visitors)! * 1.2])
      .range([height - margin.top - margin.bottom, 0]);

    // X axis
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(x).tickValues(x.domain().filter((_, i) => i % 3 === 0)))
      .selectAll('text')
      .style('font-size', '10px')
      .style('fill', '#64748b');

    // Y axis
    svg.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .selectAll('text')
      .style('font-size', '10px')
      .style('fill', '#64748b');

    // Line generator
    const line = d3.line<{ hour: string; visitors: number }>()
      .x(d => x(d.hour) || 0)
      .y(d => y(d.visitors))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Points
    svg.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', d => x(d.hour) || 0)
      .attr('cy', d => y(d.visitors))
      .attr('r', 4)
      .attr('fill', '#d97706');

  }, [onlineCount]);

  useEffect(() => {
    if (!roomsChartRef.current) return;

    d3.select(roomsChartRef.current).selectAll('*').remove();

    const width = 450;
    const height = 220;
    const margin = { top: 20, right: 20, bottom: 35, left: 40 };

    const svg = d3.select(roomsChartRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const roomData = [
      { room: 'عام', activity: 145 },
      { room: 'شباب', activity: 98 },
      { room: 'بنات', activity: 112 },
      { room: 'شعر', activity: 64 },
      { room: 'مصر', activity: 85 },
      { room: 'السعودية', activity: 120 }
    ];

    const x = d3.scaleBand()
      .domain(roomData.map(d => d.room))
      .range([0, width - margin.left - margin.right])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, 160])
      .range([height - margin.top - margin.bottom, 0]);

    svg.append('g')
      .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('font-size', '11px')
      .style('fill', '#64748b');

    svg.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .selectAll('text')
      .style('font-size', '10px')
      .style('fill', '#64748b');

    svg.selectAll('.bar')
      .data(roomData)
      .enter()
      .append('rect')
      .attr('x', d => x(d.room) || 0)
      .attr('y', d => y(d.activity))
      .attr('width', x.bandwidth())
      .attr('height', d => height - margin.top - margin.bottom - y(d.activity))
      .attr('fill', '#3b82f6')
      .attr('rx', 6);

  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <h4 className="font-black text-xs text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
          <span>📈 إحصائيات الزوار المتواجدين على مدار 24 ساعة (D3.js)</span>
        </h4>
        <div className="overflow-x-auto flex justify-center">
          <svg ref={visitorsChartRef} className="max-w-full h-auto"></svg>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <h4 className="font-black text-xs text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
          <span>📊 نشاط الغرف الحواريّة (D3.js Bar Chart)</span>
        </h4>
        <div className="overflow-x-auto flex justify-center">
          <svg ref={roomsChartRef} className="max-w-full h-auto"></svg>
        </div>
      </div>
    </div>
  );
};
