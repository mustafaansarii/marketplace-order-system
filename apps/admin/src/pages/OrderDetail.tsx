import React from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { formatMoney, OrderStatus } from '@marketplace/shared';
import { fetcher } from '../lib/api.js';
import { StatusBadge } from '../components/StatusBadge.js';

// --- SUB-COMPONENTS ---

function OrderHeader({ order, onAdvance }: { order: any, onAdvance: () => void }) {
  const getNextStatusText = (status: string) => {
    switch (status) {
      case OrderStatus.NEW: return 'Accept Order';
      case OrderStatus.ACCEPTED: return 'Start Preparing';
      case OrderStatus.PREPARING: return 'Mark as Ready';
      case OrderStatus.READY: return 'Complete Order';
      default: return 'Advance Status';
    }
  };

  const canAdvance = [OrderStatus.NEW, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY].includes(order.status);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-100 pb-6 mb-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold tracking-wide uppercase ${
            order.provider === 'uber' ? 'bg-black text-white' : 'bg-[#FF3008] text-white'
          }`}>
            {order.provider}
          </span>
          <span className="text-sm font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
            {order.external_order_id}
          </span>
        </div>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{order.customer.name}</h2>
        <div className="text-sm font-medium text-slate-500 mt-1">{order.customer.phone || 'No phone provided'}</div>
      </div>
      
      <div className="flex flex-col items-end gap-4 w-full sm:w-auto">
        <StatusBadge status={order.status} />
        {canAdvance && (
          <button
            onClick={onAdvance}
            className="w-full sm:w-auto inline-flex items-center justify-center text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl transition-all font-semibold shadow-sm shadow-blue-200 hover:shadow-md hover:-translate-y-0.5"
          >
            {getNextStatusText(order.status)} <ChevronRight className="h-4 w-4 ml-1.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function LineItemsTable({ order }: { order: any }) {
  return (
    <table className="min-w-full divide-y divide-slate-100 mb-8">
      <thead>
        <tr>
          <th className="py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Item</th>
          <th className="py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Qty</th>
          <th className="py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</th>
          <th className="py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {order.line_items.map((item: any, idx: number) => (
          <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
            <td className="py-4 text-sm font-medium text-slate-900">{item.name}</td>
            <td className="py-4 text-sm font-semibold text-slate-500 text-right">×{item.quantity}</td>
            <td className="py-4 text-sm font-medium text-slate-500 text-right">{formatMoney(item.unit_price_cents, order.currency)}</td>
            <td className="py-4 text-sm font-bold text-slate-900 text-right">{formatMoney(item.line_total_cents, order.currency)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="border-t-2 border-slate-100">
          <td colSpan={3} className="py-6 text-right font-bold text-slate-500 text-sm uppercase tracking-wider">Total Amount</td>
          <td className="py-6 text-right font-black text-slate-900 text-2xl">{formatMoney(order.total_cents, order.currency)}</td>
        </tr>
      </tfoot>
    </table>
  );
}

function DebugPayload({ payload }: { payload: any }) {
  return (
    <details className="mt-8 pt-6 border-t border-slate-100 group">
      <summary className="text-sm font-semibold text-slate-500 cursor-pointer hover:text-slate-800 transition-colors flex items-center gap-2 select-none">
        <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
        Developer Debug JSON
      </summary>
      <pre className="mt-4 p-5 bg-slate-900 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto shadow-inner">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </details>
  );
}

// --- MAIN PAGE COMPONENT ---

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { mutate } = useSWRConfig();
  const url = `/api/orders/${id}`;
  
  const { data: order, error, isLoading } = useSWR(url, fetcher);

  const advanceOrder = async () => {
    if (!order) return;
    const flow = [OrderStatus.NEW, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.COMPLETED];
    const nextStatus = flow[flow.indexOf(order.status) + 1] || order.status;

    try {
      await mutate(
        url,
        async () => {
          const res = await fetch(`/api/orders/${id}/advance`, { method: 'POST' });
          if (!res.ok) throw new Error('Failed to advance');
          return res.json();
        },
        { optimisticData: { ...order, status: nextStatus }, rollbackOnError: true, populateCache: true, revalidate: false }
      );
    } catch (e: any) {
      alert(e.message || 'Error advancing status');
    }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading order...</div>;
  if (error || !order) return <div className="p-8 text-center text-red-500">Failed to load order.</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={() => navigate(-1)}
        className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Orders
      </button>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        
        <OrderHeader order={order} onAdvance={advanceOrder} />
        <LineItemsTable order={order} />
        <DebugPayload payload={order.raw_payload} />
        
      </div>
    </div>
  );
}

