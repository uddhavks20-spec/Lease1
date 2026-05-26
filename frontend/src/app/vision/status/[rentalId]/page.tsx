"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Camera, CheckCircle2, AlertTriangle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function VisionStatusPage() {
  const params = useParams();
  const rentalId = (params?.rentalId as string) ?? '';

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/vision/status/${rentalId}`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [rentalId]);

  if (loading) return (
    <div className="container py-20 flex justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
    </div>
  );

  const { checkoutPhotos, checkinPhotos, analysis, deposit } = data || {};

  return (
    <div className="container py-10 max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/renter/dashboard">
          <Button variant="ghost" size="icon" className="rounded-xl"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Vision Status</h1>
          <p className="text-sm text-gray-500 font-medium">Rental #{rentalId?.slice(0, 8)}</p>
        </div>
      </div>

      {/* Deposit Status */}
      {deposit && (
        <Card className="bg-gradient-to-br from-gray-900 to-black text-white rounded-3xl border-none">
          <CardContent className="p-6 flex items-center gap-4">
            <Shield className="w-10 h-10 text-primary-400" />
            <div className="flex-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Deposit Status</p>
              <p className="text-2xl font-black">₹{Number(deposit.amount).toLocaleString('en-IN')}</p>
              <Badge className={`mt-1 border-none text-[10px] font-black ${
                deposit.status === 'refunded' ? 'bg-green-600 text-white' :
                deposit.status === 'deducted' ? 'bg-red-600 text-white' :
                deposit.status === 'held' ? 'bg-blue-600 text-white' :
                'bg-amber-600 text-white'
              }`}>
                {deposit.status.toUpperCase()}
              </Badge>
              {deposit.deduction_amount > 0 && (
                <p className="text-sm text-red-400 mt-1">Deduction: ₹{Number(deposit.deduction_amount).toLocaleString('en-IN')} ({deposit.deduction_reason})</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Result */}
      {analysis ? (
        <Card className="rounded-3xl border-none shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              {analysis.anomaly_detected ? (
                <AlertTriangle className="w-6 h-6 text-red-600" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              )}
              <h2 className="text-lg font-black uppercase tracking-tight">
                {analysis.anomaly_detected ? 'Damage Detected' : 'No Anomalies'}
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Integrity Valid</span>
                <p className="font-bold">{analysis.integrity_valid ? 'Yes' : 'No'}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Match Verified</span>
                <p className="font-bold">{analysis.match_verified ? 'Yes' : 'No'}</p>
              </div>
              {analysis.damage_classification && analysis.damage_classification !== 'NONE' && (
                <>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Damage Type</span>
                    <p className="font-bold text-red-600">{analysis.damage_classification}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Severity Score</span>
                    <p className="font-bold">{analysis.severity_score}</p>
                  </div>
                </>
              )}
            </div>
            <p className="text-xs text-gray-500">{analysis.settlement_action}</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
          <CardContent className="p-10 text-center space-y-4">
            <Loader2 className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="font-bold text-gray-500">Analysis Pending</p>
            <p className="text-sm text-gray-400">Check-in photos must be uploaded before vision analysis can run.</p>
          </CardContent>
        </Card>
      )}

      {/* Photos Comparison */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Camera className="w-4 h-4 text-blue-600" />
            <h3 className="font-black text-xs uppercase tracking-widest">Checkout Baseline ({checkoutPhotos?.length || 0} photos)</h3>
          </div>
          {checkoutPhotos?.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {checkoutPhotos.map((p: any) => (
                <div key={p.id} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img src={p.image_url} alt={p.view} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="aspect-video rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-xs text-gray-400 font-medium">No baseline photos</div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Camera className="w-4 h-4 text-green-600" />
            <h3 className="font-black text-xs uppercase tracking-widest">Check-in Return ({checkinPhotos?.length || 0} photos)</h3>
          </div>
          {checkinPhotos?.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {checkinPhotos.map((p: any) => (
                <div key={p.id} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img src={p.image_url} alt={p.view} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="aspect-video rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-xs text-gray-400 font-medium">No return photos yet</div>
          )}
        </div>
      </div>

      <div className="flex justify-center gap-4 pt-4">
        <Link href="/renter/dashboard"><Button variant="outline" className="rounded-xl font-bold">Dashboard</Button></Link>
        {!checkinPhotos?.length && (
          <Link href={`/renter/return/${rentalId}`}><Button className="rounded-xl font-bold">Upload Return Photos</Button></Link>
        )}
      </div>
    </div>
  );
}
