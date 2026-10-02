import React, { useMemo, useState } from 'react';
import useSWR from 'swr';
import { Search, ChevronRight, ChevronLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { OrderStatus, formatMoney, OrderSummary } from '@marketplace/shared';
import { fetcher } from '../lib/api.js';
import { StatusBadge } from '../components/StatusBadge.js';

// --- SUB-COMPONENTS ---

function OrderFilters({ query, updateQuery }: { query: Record<string, string>, updateQuery: (u: Partial<Record<string, string>>) => void }) {
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateQuery({ q: formData.get('q') as string });
  };

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-3 items-center">
      <form onSubmit={handleSearch} className="flex-1 min-w-[200px] relative">
        <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
        <input 
          name="q"
          defaultValue={query.q}
          type="text" 
          placeholder="Search customer or ID..." 
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
        />
      </form>

      <select 
        className="border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 transition-all font-medium text-slate-700"
        value={query.provider}
        onChange={e => updateQuery({ provider: e.target.value })}
      >
        <option value="">All Platforms</option>
        <option value="uber">Uber Eats</option>
        <option value="doordash">DoorDash</option>
      </select>

      <select 
        className="border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 transition-all font-medium text-slate-700"
        value={query.status}
        onChange={e => updateQuery({ status: e.target.value })}
      >
        <option value="">All Statuses</option>
        <option value={OrderStatus.NEW}>New</option>
        <option value={OrderStatus.ACCEPTED}>Accepted</option>
        <option value={OrderStatus.PREPARING}>Preparing</option>
        <option value={OrderStatus.READY}>Ready</option>
        <option value={OrderStatus.COMPLETED}>Completed</option>
        <option value={OrderStatus.CANCELLED}>Cancelled</option>
      </select>

      <select 
        className="border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 transition-all font-medium text-slate-700"
        value={query.sort}
        onChange={e => updateQuery({ sort: e.target.value })}
      >
        <option value="time_desc">Newest First</option>
        <option value="time_asc">Oldest First</option>
      </select>
    </div>
  );
}

function OrderTable({ data, isLoading, error, onRowClick }: { data: { items: OrderSummary[] } | undefined, isLoading: boolean, error: unknown, onRowClick: (id: string) => void }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-slate-50/50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Platform</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider ">Order ID</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider ">Time</th>
            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-100">
          {isLoading && <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">Loading orders...</td></tr>}
          {!!error && <tr><td colSpan={7} className="px-6 py-12 text-center text-red-500 font-medium">Failed to load orders. Please try again.</td></tr>}
          {!isLoading && !error && data?.items?.length === 0 && (
            <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">No orders found matching your filters.</td></tr>
          )}
          {data?.items?.map((order: OrderSummary) => (
            <tr 
              key={order.id} 
              className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
              tabIndex={0}
              onClick={() => onRowClick(order.id)}
              onKeyDown={(e) => { if (e.key === 'Enter') onRowClick(order.id); }}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold tracking-wide uppercase ${
                  order.provider === 'uber' ? 'bg-black text-white' : 'bg-[#FF3008] text-white'
                }`}>
                  {order.provider}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-mono ">
                {order.external_order_id.slice(0, 12)}...
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-bold text-slate-900">{order.customer.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                {formatMoney(order.total_cents, order.currency)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={order.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-500 ">
                {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <ChevronRight className="inline-block h-5 w-5 text-slate-300 group-hover:text-blue-600 transition-colors" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}




function Pagination({ data, cursorHistory, onNext, onPrev, limit, onLimitChange }: { 
  data: { total_count: number, next_cursor?: string } | undefined, 
  cursorHistory: string[], 
  onNext: () => void, 
  onPrev: () => void,
  limit: string,
  onLimitChange: (l: string) => void
}) {
  const currentPage = cursorHistory.length + 1;
  return (
    <div className="flex justify-between items-center mt-6 px-2">
      <div className="flex items-center gap-4 w-1/3">
        <span className="text-sm text-slate-500 font-medium">
          Total: {data?.total_count || 0}
        </span>
        <select 
          className="border border-slate-200 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 font-medium text-slate-700"
          value={limit}
          onChange={e => onLimitChange(e.target.value)}
        >
          <option value="10">10 / page</option>
          <option value="25">25 / page</option>
          <option value="50">50 / page</option>
          <option value="100">100 / page</option>
        </select>
      </div>
      
      <div className="flex justify-center items-center gap-4 w-1/3">
        <button 
          onClick={onPrev}
          disabled={cursorHistory.length === 0}
          className="p-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold text-slate-700 w-16 text-center">Page {currentPage}</span>
        <button 
          onClick={onNext}
          disabled={!data?.next_cursor}
          className="p-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="w-1/3"></div>
    </div>
  );
}

// --- MAIN PAGE COMPONENT ---

export default function OrderList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);

  const query = useMemo(() => ({
    provider: searchParams.get('provider') || '',
    status: searchParams.get('status') || '',
    q: searchParams.get('q') || '',
    sort: searchParams.get('sort') || 'time_desc',
    limit: searchParams.get('limit') || '50',
    cursor: searchParams.get('cursor') || '',
  }), [searchParams]);

  const updateQuery = (updates: Partial<typeof query>, replace = true) => {
    if (updates.provider !== undefined || updates.status !== undefined || updates.q !== undefined || updates.sort !== undefined) {
      updates.cursor = '';
      setCursorHistory([]);
    }

    const next = { ...query, ...updates };

    const p = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => {
      if (v && (k !== 'sort' || v !== 'time_desc') && (k !== 'limit' || v !== '50')) {
        p.set(k, v);
      }
    });
    
    setSearchParams(p, { replace });
  };

  const handleNext = () => {
    if (data?.next_cursor) {
      setCursorHistory([...cursorHistory, query.cursor]);
      updateQuery({ cursor: data.next_cursor }, false);
    }
  };

  const handlePrev = () => {
    if (cursorHistory.length > 0) {
      const newHistory = [...cursorHistory];
      const prevCursor = newHistory.pop() || '';
      setCursorHistory(newHistory);
      updateQuery({ cursor: prevCursor }, false);
    }
  };

  const url = useMemo(() => {
    const p = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => { 
      if (v) p.set(k, v); 
    });
    return `/api/orders?${p.toString()}`;
  }, [query]);

  const { data, error, isLoading } = useSWR(url, fetcher);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <OrderFilters query={query} updateQuery={updateQuery} />
      
      <OrderTable 
        data={data as { items: OrderSummary[] } | undefined} 
        isLoading={isLoading} 
        error={error} 
        onRowClick={(id) => navigate(`/orders/${id}`)} 
      />
      
      <Pagination 
        data={data as { total_count: number, next_cursor?: string } | undefined}
        cursorHistory={cursorHistory}
        onNext={handleNext}
        onPrev={handlePrev}
        limit={query.limit || '50'}
        onLimitChange={(val) => updateQuery({ limit: val })}
      />
    </div>
  );
}
