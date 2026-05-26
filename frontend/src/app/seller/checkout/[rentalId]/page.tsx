"use client";

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, CheckCircle2, ArrowLeft, Loader2, Shield, Info } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const rentalId = (params?.rentalId as string) ?? '';

  const [images, setImages] = useState<{ dataUrl: string; view: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

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
      await api.post(`/vision/checkout/${rentalId}`, { images });
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
        <h1 className="text-3xl font-black uppercase tracking-tight">Handover Complete</h1>
        <p className="text-gray-500 font-medium">Baseline photos saved. The rental is now active. These photos will be used at return time for damage verification.</p>
        <Link href="/seller/dashboard"><Button className="rounded-xl font-black">Back to Dashboard</Button></Link>
      </div>
    );
  }

  return (
    <div className="container py-10 max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/seller/dashboard">
          <Button variant="ghost" size="icon" className="rounded-xl"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Item Handover</h1>
          <p className="text-sm text-gray-500 font-medium">Rental #{rentalId?.slice(0, 8)}</p>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-blue-50 to-primary-50 dark:from-blue-900/10 dark:to-primary-900/10 border-none rounded-3xl">
        <CardContent className="p-6 flex items-start gap-4">
          <Info className="w-6 h-6 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <p className="font-bold mb-1">Before handing over the item:</p>
            <ul className="list-disc ml-5 space-y-1 text-gray-500">
              <li>Take clear photos showing current condition from all 4 sides</li>
              <li>Capture any existing wear, scratches, or marks</li>
              <li>Include serial numbers if visible</li>
              <li>These photos serve as the baseline for damage comparison at return</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-3xl">
        <CardContent className="p-8 space-y-6">
          <div className="flex items-center gap-3">
            <Camera className="w-6 h-6 text-primary-600" />
            <h2 className="text-lg font-black uppercase tracking-tight">Capture Baseline Photos</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {['front', 'rear', 'left', 'right'].map(view => (
              <div key={view}>
                <input type="file" accept="image/*" capture="environment" className="hidden" id={`file-${view}`} onChange={(e) => handleFile(e, view)} />
                {images.find(i => i.view === view) ? (
                  <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-green-200">
                    <img src={images.find(i => i.view === view)!.dataUrl} alt={view} className="w-full h-full object-cover" />
                    <button onClick={() => removeImage(images.findIndex(i => i.view === view))} className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs font-black">×</button>
                    <Badge className="absolute bottom-2 left-2 bg-green-600 text-white border-none text-[9px] font-black uppercase">{view}</Badge>
                  </div>
                ) : (
                  <label htmlFor={`file-${view}`} className="block cursor-pointer w-full aspect-square rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-2 hover:border-primary-300 transition-colors bg-gray-50 dark:bg-gray-900">
                    <Upload className="w-6 h-6 text-gray-300" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{view}</span>
                  </label>
                )}
              </div>
            ))}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={images.length === 0 || uploading}
            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs"
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Shield className="w-5 h-5 mr-2" />}
            {uploading ? 'Uploading...' : `Save ${images.length} Baseline Photo${images.length !== 1 ? 's' : ''}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
