"use client";

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, CheckCircle2, AlertTriangle, ArrowLeft, Loader2, Shield } from 'lucide-react';
import Link from 'next/link';

export default function ReturnPage() {
  const params = useParams();
  const router = useRouter();
  const rentalId = params.rentalId as string;

  const [images, setImages] = useState<{ dataUrl: string; view: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [deposit, setDeposit] = useState<any>(null);
  const [rental, setRental] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get(`/deposits/${rentalId}`).then(r => setDeposit(r.data.deposit)).catch(() => {});
    api.get('/rentals').then(r => {
      const found = (r.data.rentals || []).find((rt: any) => rt.id === rentalId);
      setRental(found);
    }).catch(() => {});
  }, [rentalId]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, view: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImages(prev => [...prev, { dataUrl: ev.target?.result as string, view }]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeImage = (idx: number) => setImages(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (images.length === 0) return;
    setUploading(true);
    try {
      await api.post(`/vision/checkin/${rentalId}`, { images });
      setSuccess(true);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="container py-20 max-w-xl mx-auto text-center space-y-8">
        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tight">Return Photos Submitted</h1>
        <p className="text-gray-500 font-medium">Your return photos have been uploaded. An admin will review the condition and process your deposit refund within 24 hours.</p>
        <div className="p-6 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-200 dark:border-amber-800 text-left space-y-2">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-xs uppercase tracking-widest">
            <AlertTriangle className="w-4 h-4" /> What happens next?
          </div>
          <ul className="text-sm text-amber-800 dark:text-amber-200/80 space-y-1 ml-4 list-disc">
            <li>Admin runs vision analysis comparing return photos vs handover baseline</li>
            <li>If no damage detected: deposit released in full within 24h</li>
            <li>If damage found: deduction calculated per policy, remainder refunded</li>
            <li>You can dispute the assessment by contacting support</li>
          </ul>
        </div>
        <div className="flex gap-4 justify-center">
          <Link href="/renter/dashboard"><Button variant="outline" className="rounded-xl font-bold">Back to Dashboard</Button></Link>
          <Link href={`/vision/status/${rentalId}`}><Button className="rounded-xl font-bold">View Status</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10 max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/renter/dashboard">
          <Button variant="ghost" size="icon" className="rounded-xl"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Return Item</h1>
          <p className="text-sm text-gray-500 font-medium">Rental #{rentalId?.slice(0, 8)}</p>
        </div>
      </div>

      {/* Deposit Info */}
      {deposit && (
        <Card className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/10 dark:to-secondary-900/10 border-none rounded-3xl">
          <CardContent className="p-6 flex items-center gap-4">
            <Shield className="w-10 h-10 text-primary-600" />
            <div>
              <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Security Deposit</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white">₹{Number(deposit.amount).toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-500 font-medium">Status: <Badge className="bg-blue-100 text-blue-800 border-none text-[10px] font-black">{deposit.status}</Badge></p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo Upload */}
      <Card className="border-none shadow-sm rounded-3xl">
        <CardContent className="p-8 space-y-6">
          <div className="flex items-center gap-3">
            <Camera className="w-6 h-6 text-primary-600" />
            <h2 className="text-lg font-black uppercase tracking-tight">Upload Return Photos</h2>
          </div>
          <p className="text-sm text-gray-500">Take clear photos of the item from all angles. These will be compared against the handover baseline to verify condition.</p>

          <div className="grid grid-cols-2 gap-4">
            {['front', 'rear', 'left', 'right'].map(view => (
              <div key={view}>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFile(e, view)} />
                {images.find(i => i.view === view) ? (
                  <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-green-200">
                    <img src={images.find(i => i.view === view)!.dataUrl} alt={view} className="w-full h-full object-cover" />
                    <button onClick={() => removeImage(images.findIndex(i => i.view === view))} className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs font-black">×</button>
                    <Badge className="absolute bottom-2 left-2 bg-green-600 text-white border-none text-[9px] font-black uppercase">{view}</Badge>
                  </div>
                ) : (
                  <button onClick={() => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.capture = 'environment'; inp.onchange = (e: any) => handleFile(e, view); inp.click(); }} className="w-full aspect-square rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-2 hover:border-primary-300 transition-colors bg-gray-50 dark:bg-gray-900">
                    <Upload className="w-6 h-6 text-gray-300" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{view}</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={images.length === 0 || uploading}
            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs"
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Upload className="w-5 h-5 mr-2" />}
            {uploading ? 'Uploading...' : `Submit ${images.length} Photo${images.length !== 1 ? 's' : ''}`}
          </Button>
        </CardContent>
      </Card>

      {images.length === 0 && (
        <div className="p-6 bg-amber-50 dark:bg-amber-900/10 rounded-3xl border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-xs uppercase tracking-widest mb-2">
            <AlertTriangle className="w-4 h-4" /> Tips for clear photos
          </div>
          <ul className="text-sm text-amber-800 dark:text-amber-200/80 space-y-1 ml-4 list-disc">
            <li>Use good lighting — natural daylight is best</li>
            <li>Capture all 4 sides (front, rear, left, right)</li>
            <li>Include close-ups of any existing wear or serial numbers</li>
            <li>Ensure photos are in focus and not blurry</li>
          </ul>
        </div>
      )}
    </div>
  );
}
