import React, { useEffect, useState } from 'react';
import { pickupApi } from '../api';

export default function Pending() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await pickupApi.list({ status: 'pending', page: 1, limit: 20 });
      const list = res.data?.data?.pickups || res.data?.pickups || [];
      setItems(list);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) {
      window.location.href = '/login';
      return;
    }
    load();
  }, []);

  const approve = async (id) => {
    try {
      await pickupApi.approve(id);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Approve failed');
    }
  };
  const reject = async (id) => {
    const reason = prompt('Reason for rejection?') || 'Not suitable';
    await pickupApi.reject(id, reason);
    await load();
  };

  // token check handled in useEffect

  return (
    <div>
      <h2 style={{ color: '#1B5E20' }}>Pending Pickups</h2>
      {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : items.length === 0 ? (
        <div>No pending requests.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {items.map((p) => (
            <div key={p._id} style={{ background: '#fff', padding: 16, borderRadius: 12, boxShadow: '0 6px 18px rgba(0,0,0,0.06)' }}>
              <div style={{ fontWeight: 700 }}>{p.user?.name} • {p.wasteType}</div>
              <div style={{ color: '#475569', fontSize: 14 }}>Weight: {p.estimatedWeight} grams</div>
              <div style={{ color: '#475569', fontSize: 14 }}>Address: {p.address?.fullAddress}</div>
              {Array.isArray(p.images) && p.images.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
                  {p.images.slice(0, 6).map((img, idx) => (
                    <a key={idx} href={img} target="_blank" rel="noreferrer" style={{ display: 'block' }}>
                      <img src={img} alt={`waste-${idx}`} style={{ width: '100%', height: 96, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'zoom-in' }} />
                    </a>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={() => approve(p._id)} style={{ padding: '8px 12px', border: 0, background: '#16a34a', color: '#fff', borderRadius: 8 }}>Approve</button>
                <button onClick={() => reject(p._id)} style={{ padding: '8px 12px', border: 0, background: '#dc2626', color: '#fff', borderRadius: 8 }}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


