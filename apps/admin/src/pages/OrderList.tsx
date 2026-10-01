import React, { useMemo } from 'react';
import useSWR from 'swr';
import { Search, ChevronRight, ChevronLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { OrderStatus, formatMoney } from '@marketplace/shared';
import { fetcher } from '../lib/api.js';
import { StatusBadge } from '../components/StatusBadge.js';

// --- SUB-COMPONENTS ---

function OrderFilters({ query, updateQuery }: { query: any, updateQuery: (u: any) => void }) {
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

function OrderTable({ data, isLoading, error, onRowClick }: { data: any, isLoading: boolean, error: any, onRowClick: (id: string) => void }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-slate-50/50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Platform</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Order ID</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Time</th>
            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-100">
          {isLoading && <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">Loading orders...</td></tr>}
          {error && <tr><td colSpan={7} className="px-6 py-12 text-center text-red-500 font-medium">Failed to load orders. Please try again.</td></tr>}
          {!isLoading && !error && data?.items?.length === 0 && (
            <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">No orders found matching your filters.</td></tr>
          )}
          {data?.items?.map((order: any) => (
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
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-mono hidden sm:table-cell">
                {order.external_order_id.slice(0, 12)}...
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-bold text-slate-900">{order.customer.name}</div>
                <div className="text-xs text-slate-500 hidden sm:block mt-0.5">{order.customer.phone || 'No phone provided'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                {formatMoney(order.total_cents, order.currency)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={order.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-500 hidden md:table-cell">
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

function OrderPagination({ query, nextCursor, totalCount, updateQuery, onPrev }: { query: any, nextCursor?: string, totalCount?: number, updateQuery: (u: any, r: boolean) => void, onPrev: () => void }) {
  const currentPage = parseInt(query.page || '1', 10);
  const limit = parseInt(query.limit || '10', 10);
  const totalPages = totalCount ? Math.ceil(totalCount / limit) : 1;

  const handleNext = () => {
    updateQuery({ cursor: nextCursor, page: (currentPage + 1).toString() }, false);
  };

  return (
    <div className="flex items-center justify-between py-2">
      
      {/* LEFT: Rows per page */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-500">Rows per page:</span>
        <select 
          className="bg-transparent border-none text-sm outline-none font-bold text-slate-700 cursor-pointer hover:text-blue-600 transition-colors"
          value={query.limit}
          onChange={e => updateQuery({ limit: e.target.value }, true)}
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
      </div>

      {/* MID: Previous / Current Page / Next */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={!query.cursor}
          title="Previous Page"
          className={`p-1.5 rounded-lg transition-all ${
            query.cursor 
              ? 'text-slate-700 hover:bg-slate-200' 
              : 'text-slate-300 cursor-not-allowed'
          }`}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        <span className="text-sm font-bold text-slate-700 min-w-[2rem] text-center">
          {currentPage}
        </span>
        
        <button
          onClick={handleNext}
          disabled={!nextCursor}
          title="Next Page"
          className={`p-1.5 rounded-lg transition-all ${
            nextCursor 
              ? 'text-slate-700 hover:bg-slate-200' 
              : 'text-slate-300 cursor-not-allowed'
          }`}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* RIGHT: Total Pages */}
      <div className="text-sm font-medium text-slate-400">
        Page {currentPage} of {totalPages}
      </div>
      
    </div>
  );
}

// --- MAIN PAGE COMPONENT ---

export default function OrderList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const query = useMemo(() => ({
    provider: searchParams.get('provider') || '',
    status: searchParams.get('status') || '',
    q: searchParams.get('q') || '',
    sort: searchParams.get('sort') || 'time_desc',
    limit: searchParams.get('limit') || '10',
    cursor: searchParams.get('cursor') || '',
    page: searchParams.get('page') || '1',
  }), [searchParams]);

  const updateQuery = (updates: Partial<typeof query>, replace = true) => {
    const next = { ...query, ...updates };
    
    if (updates.provider !== undefined || updates.status !== undefined || updates.q !== undefined || updates.sort !== undefined || updates.limit !== undefined) {
      next.cursor = ''; // Reset cursor to page 1 on filter/sort change
      next.page = '1';  // Reset page number
    }

    const p = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => {
      if (v && (k !== 'sort' || v !== 'time_desc') && (k !== 'limit' || v !== '10') && (k !== 'page' || v !== '1')) {
        p.set(k, v);
      }
    });
    
    setSearchParams(p, { replace });
  };

  const url = useMemo(() => {
    const p = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => { 
      if (v && k !== 'page') p.set(k, v); 
    });
    return `/api/orders?${p.toString()}`;
  }, [query]);

  const { data, error, isLoading } = useSWR(url, fetcher);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <OrderFilters query={query} updateQuery={updateQuery} />
      
      <OrderTable 
        data={data} 
        isLoading={isLoading} 
        error={error} 
        onRowClick={(id) => navigate(`/orders/${id}`)} 
      />
      
      <OrderPagination 
        query={query} 
        nextCursor={data?.next_cursor} 
        totalCount={data?.total_count}
        updateQuery={updateQuery} 
        onPrev={() => navigate(-1)} 
      />
    </div>
  );
}
