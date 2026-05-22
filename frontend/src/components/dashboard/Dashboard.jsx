import React, { useCallback, useEffect, useState } from 'react';
import { getDashboardStats } from '../../services/api';

const monthlySales = [
    { month: 'Jan', value: 156 },
    { month: 'Feb', value: 374 },
    { month: 'Mar', value: 188 },
    { month: 'Apr', value: 286 },
    { month: 'May', value: 174 },
    { month: 'Jun', value: 182 },
    { month: 'Jul', value: 276 },
    { month: 'Aug', value: 98 },
    { month: 'Sep', value: 205 },
    { month: 'Oct', value: 381 },
    { month: 'Nov', value: 266 },
    { month: 'Dec', value: 98 },
];

const statisticPoints = [
    { month: 'Jan', primary: 182, secondary: 40 },
    { month: 'Feb', primary: 192, secondary: 30 },
    { month: 'Mar', primary: 169, secondary: 50 },
    { month: 'Apr', primary: 160, secondary: 40 },
    { month: 'May', primary: 176, secondary: 55 },
    { month: 'Jun', primary: 165, secondary: 40 },
];

const regionData = [
    { region: 'United States', value: 42 },
    { region: 'India', value: 28 },
    { region: 'United Kingdom', value: 16 },
    { region: 'Singapore', value: 9 },
    { region: 'Other', value: 5 },
];

const recentOrders = [
    { product: 'MacBook Pro 14', category: 'Workstation', price: '$2,299', status: 'Assigned' },
    { product: 'Cisco Meraki MR46', category: 'Network', price: '$950', status: 'In Store' },
    { product: 'Surface Pro 9', category: 'Tablet', price: '$1,399', status: 'Expired' },
    { product: 'Logitech MX Keys', category: 'Accessory', price: '$110', status: 'In Use' },
];

const DashboardIcon = ({ type }) => {
    const commonProps = { className: 'h-5 w-5', viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', 'aria-hidden': 'true' };
    const icons = {
        assets: <path d="M4.75 8.25L12 4.25L19.25 8.25L12 12.25L4.75 8.25ZM4.75 12L12 16L19.25 12M4.75 15.75L12 19.75L19.25 15.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>,
        users: <path d="M9.5 11.5C11.43 11.5 13 9.93 13 8C13 6.07 11.43 4.5 9.5 4.5C7.57 4.5 6 6.07 6 8C6 9.93 7.57 11.5 9.5 11.5ZM4.25 19C4.92 16.24 6.88 14.5 9.5 14.5C12.12 14.5 14.08 16.24 14.75 19M16 11.25C17.52 11.25 18.75 10.02 18.75 8.5C18.75 6.98 17.52 5.75 16 5.75M15.75 14.75C17.94 14.94 19.56 16.46 20.25 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>,
        active: <path d="M8.75 12.25L10.75 14.25L15.5 9.5M12 21.25C17.11 21.25 21.25 17.11 21.25 12C21.25 6.89 17.11 2.75 12 2.75C6.89 2.75 2.75 6.89 2.75 12C2.75 17.11 6.89 21.25 12 21.25Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>,
        inactive: <path d="M8.75 8.75L15.25 15.25M15.25 8.75L8.75 15.25M12 21.25C17.11 21.25 21.25 17.11 21.25 12C21.25 6.89 17.11 2.75 12 2.75C6.89 2.75 2.75 6.89 2.75 12C2.75 17.11 6.89 21.25 12 21.25Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>,
        productTypes: <path d="M5 5.25H10.25V10.5H5V5.25ZM13.75 5.25H19V10.5H13.75V5.25ZM5 14H10.25V19.25H5V14ZM13.75 14H19V19.25H13.75V14Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>,
        departments: <path d="M5.25 19.25V4.75H18.75V19.25M8.25 8.25H10.25M13.75 8.25H15.75M8.25 12H10.25M13.75 12H15.75M9 19.25V15.5H15V19.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>,
        repair: <path d="M14.25 6.5L17.5 3.25C18.65 4.4 18.65 6.26 17.5 7.41L15.82 9.09L14.25 7.52V6.5ZM14.25 7.52L5.75 16.02C5.2 16.57 5.2 17.47 5.75 18.02C6.3 18.57 7.2 18.57 7.75 18.02L16.25 9.52M4.75 5.75L8 9M4.75 9L8 5.75M13.75 15.75L18.25 20.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>,
        clock: <path d="M12 21.25C17.11 21.25 21.25 17.11 21.25 12C21.25 6.89 17.11 2.75 12 2.75C6.89 2.75 2.75 6.89 2.75 12C2.75 17.11 6.89 21.25 12 21.25ZM12 7.5V12.25L15.25 14.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>,
    };
    return <svg {...commonProps}>{icons[type] || icons.assets}</svg>;
};

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [statsError, setStatsError] = useState('');

    const loadStats = useCallback(async ({ silent = false } = {}) => {
        if (!silent) {
            setLoadingStats(true);
        }

        try {
            const response = await getDashboardStats();
            setStats(response.data);
            setStatsError('');
        } catch (error) {
            setStatsError(error.response?.data?.error || 'Unable to load dashboard statistics.');
        } finally {
            if (!silent) {
                setLoadingStats(false);
            }
        }
    }, []);

    useEffect(() => {
        loadStats();
        const intervalId = window.setInterval(() => loadStats({ silent: true }), 60000);
        return () => window.clearInterval(intervalId);
    }, [loadStats]);

    const maxMonthlyValue = Math.max(...monthlySales.map((item) => item.value));
    const chartWidth = 600;
    const chartHeight = 170;
    const xStep = chartWidth / (statisticPoints.length - 1);
    const yScale = (value) => chartHeight - (value / 250) * chartHeight;
    const primaryLine = statisticPoints.map((point, index) => `${index * xStep},${yScale(point.primary)}`).join(' ');
    const secondaryLine = statisticPoints.map((point, index) => `${index * xStep},${yScale(point.secondary)}`).join(' ');
    const primaryArea = `0,${chartHeight} ${primaryLine} ${chartWidth},${chartHeight}`;
    const targetPercent = 75.55;
    const circumference = 314;
    const targetOffset = circumference - (circumference * targetPercent) / 100;
    const summaryCards = [
        { label: 'Total Users', value: stats?.totalUsers, icon: 'users', tone: 'blue' },
        { label: 'Active Users', value: stats?.activeUsers, icon: 'active', tone: 'emerald' },
        { label: 'Inactive Users', value: stats?.inactiveUsers, icon: 'inactive', tone: 'red' },
        { label: 'Total Assets', value: stats?.totalAssets, icon: 'assets', tone: 'indigo' },
        { label: 'Assigned Assets', value: stats?.assignedAssets, icon: 'active', tone: 'cyan' },
        { label: 'Available Assets', value: stats?.availableAssets, icon: 'clock', tone: 'amber' },
        { label: 'Total Product Types', value: stats?.totalProductTypes, icon: 'productTypes', tone: 'violet' },
        { label: 'Departments Count', value: stats?.departmentsCount, icon: 'departments', tone: 'slate' },
    ];
    const toneClasses = {
        blue: 'bg-blue-50 text-blue-700 ring-blue-100',
        emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
        red: 'bg-red-50 text-red-700 ring-red-100',
        indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
        cyan: 'bg-cyan-50 text-cyan-700 ring-cyan-100',
        amber: 'bg-amber-50 text-amber-700 ring-amber-100',
        violet: 'bg-violet-50 text-violet-700 ring-violet-100',
        slate: 'bg-slate-100 text-slate-700 ring-slate-200',
    };

    return (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <div key={card.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <span className={`inline-flex h-11 w-11 items-center justify-center rounded-lg ring-1 ${toneClasses[card.tone]}`}>
                    <DashboardIcon type={card.icon} />
                  </span>
                </div>
                <div className="mt-5 text-sm font-semibold text-slate-500">{card.label}</div>
                {loadingStats ? (
                  <div className="mt-3 h-8 w-24 animate-pulse rounded-md bg-slate-200"></div>
                ) : (
                  <div className="mt-2 text-3xl font-bold text-slate-950">{Number(card.value || 0).toLocaleString()}</div>
                )}
              </div>
            ))}
          </div>

          {statsError && (
            <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-medium">{statsError}</span>
              <button type="button" onClick={() => loadStats()} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-red-700 shadow-sm ring-1 ring-red-200 transition hover:bg-red-100">
                Retry
              </button>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="grid gap-4">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">Monthly Assets</h2>
                    <p className="mt-1 text-sm text-slate-500">Dummy asset volume by month</p>
                  </div>
                  <button type="button" className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="More monthly asset options">...</button>
                </div>
                <div className="mt-5 h-44">
                  <div className="flex h-full items-end gap-3 border-b border-slate-200 px-2">
                    {monthlySales.map((item) => (
                      <div key={item.month} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                        <div className="w-full rounded-t-md bg-blue-600 transition hover:bg-blue-700" style={{ height: `${(item.value / maxMonthlyValue) * 128}px` }} title={`${item.month}: ${item.value}`}></div>
                        <span className="text-[11px] font-medium text-slate-500">{item.month}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">Monthly Target</h2>
                    <p className="mt-1 text-sm text-slate-500">Target set for each month</p>
                  </div>
                  <button type="button" className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="More target options">...</button>
                </div>
                <div className="mt-5 flex flex-col items-center">
                  <div className="relative h-40 w-72 max-w-full">
                    <svg viewBox="0 0 240 150" className="h-full w-full">
                      <path d="M30 120A90 90 0 0 1 210 120" stroke="#e5e7eb" strokeWidth="10" strokeLinecap="round" fill="none"/>
                      <path d="M30 120A90 90 0 0 1 210 120" stroke="#4f63ff" strokeWidth="10" strokeLinecap="round" fill="none" strokeDasharray={circumference} strokeDashoffset={targetOffset}/>
                    </svg>
                    <div className="absolute inset-x-0 top-16 text-center">
                      <div className="text-3xl font-bold text-slate-900">{targetPercent}%</div>
                      <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">+10%</span>
                    </div>
                  </div>
                  <p className="max-w-sm text-center text-sm leading-6 text-slate-600">You saved $3,287 today. Asset utilization is higher than last month.</p>
                </div>
              </div>
              <div className="grid grid-cols-3 border-t border-slate-200 bg-slate-50">
                {[
                    { label: 'Target', value: '$20K', direction: 'down' },
                    { label: 'Revenue', value: '$20K', direction: 'up' },
                    { label: 'Today', value: '$20K', direction: 'up' },
                ].map((item) => (
                  <div key={item.label} className="px-5 py-4 text-center">
                    <div className="text-xs font-medium text-slate-500">{item.label}</div>
                    <div className="mt-1 text-sm font-bold text-slate-950">
                      {item.value} <span className={item.direction === 'down' ? 'text-red-500' : 'text-emerald-600'}>{item.direction === 'down' ? '-' : '+'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-950">Statistics</h2>
                <p className="mt-1 text-sm text-slate-500">Target and utilization trend</p>
              </div>
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-xs font-semibold text-slate-500">
                <button type="button" className="rounded-md bg-slate-100 px-3 py-1.5 text-slate-950">Monthly</button>
                <button type="button" className="rounded-md px-3 py-1.5 hover:bg-slate-50">Quarterly</button>
                <button type="button" className="rounded-md px-3 py-1.5 hover:bg-slate-50">Annually</button>
              </div>
            </div>
            <div className="mt-6 overflow-x-auto">
              <svg viewBox="0 0 600 220" className="h-72 min-w-[720px] w-full">
                {[0, 50, 100, 150, 200, 250].map((tick) => (
                  <g key={tick}>
                    <line x1="0" x2="600" y1={yScale(tick) + 20} y2={yScale(tick) + 20} stroke="#e5e7eb" strokeWidth="1"/>
                    <text x="0" y={yScale(tick) + 16} fill="#64748b" fontSize="10">{tick}</text>
                  </g>
                ))}
                <polygon points={`0,190 ${primaryArea} 600,190`} fill="#4f63ff" opacity="0.12" transform="translate(0 20)"/>
                <polyline points={primaryLine} fill="none" stroke="#4f63ff" strokeWidth="2.5" transform="translate(0 20)"/>
                <polyline points={secondaryLine} fill="none" stroke="#8db3ff" strokeWidth="2" transform="translate(0 20)"/>
                {statisticPoints.map((point, index) => (
                  <text key={point.month} x={index * xStep} y="215" fill="#475569" fontSize="11" textAnchor={index === 0 ? 'start' : index === statisticPoints.length - 1 ? 'end' : 'middle'}>{point.month}</text>
                ))}
              </svg>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-950">Assets by Region</h2>
                  <p className="mt-1 text-sm text-slate-500">Dummy location distribution</p>
                </div>
                <button type="button" className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="More region options">...</button>
              </div>
              <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <svg viewBox="0 0 460 210" className="h-44 w-full">
                  <path d="M54 88C80 70 122 69 150 83C172 94 186 118 214 116C249 113 261 86 298 84C340 82 358 111 402 105" fill="none" stroke="#cbd5e1" strokeWidth="28" strokeLinecap="round"/>
                  <circle cx="118" cy="82" r="9" fill="#4f63ff"/>
                  <circle cx="296" cy="84" r="8" fill="#22c55e"/>
                  <circle cx="212" cy="116" r="7" fill="#f59e0b"/>
                  <circle cx="370" cy="103" r="6" fill="#ef4444"/>
                  <text x="180" y="180" fill="#94a3b8" fontSize="13">Regional asset footprint</text>
                </svg>
              </div>
              <div className="mt-4 space-y-3">
                {regionData.map((item) => (
                  <div key={item.region}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-700">{item.region}</span>
                      <span className="font-semibold text-slate-900">{item.value}%</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-blue-600" style={{ width: `${item.value}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-950">Recent Orders</h2>
                  <p className="mt-1 text-sm text-slate-500">Latest dummy asset purchases</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Filter</button>
                  <button type="button" className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">See all</button>
                </div>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[620px]">
                  <thead>
                    <tr>
                      <th className="text-left">Product</th>
                      <th className="text-left">Category</th>
                      <th className="text-left">Price</th>
                      <th className="text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.product}>
                        <td className="font-semibold">{order.product}</td>
                        <td>{order.category}</td>
                        <td>{order.price}</td>
                        <td><span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">{order.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
    );
};

export default Dashboard;
