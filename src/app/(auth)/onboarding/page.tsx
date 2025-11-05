'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, ArrowRight, SkipForward, Loader2, X } from 'lucide-react';
import Image from 'next/image';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    name: '',
    topSize: '',
    bottomSize: '',
    budgetMin: '',
    budgetMax: '',
  });

  // Debug: Monitor state changes
  useEffect(() => {
    console.log('🔄 State changed - photos:', photos.length, 'previews:', photoPreviewUrls.length);
    console.log('Preview URLs:', photoPreviewUrls);
    console.log('Should show preview grid?', photoPreviewUrls.length > 0);
  }, [photos, photoPreviewUrls]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📸 Photo upload triggered');
    console.log('Files from event:', e.target.files ? e.target.files.length : 0, 'files');
    
    if (e.target.files) {
      const files = Array.from(e.target.files);
      console.log('✅ Files array:', files);
      console.log('Number of files:', files.length);
      
      files.forEach((file, index) => {
        console.log(`File ${index + 1}:`, {
          name: file.name,
          type: file.type,
          size: file.size,
        });
      });
      
      setPhotos(files);
      console.log('✅ Photos state updated');
      
      // Create preview URLs
      try {
        const previews = files.map(file => {
          const url = URL.createObjectURL(file);
          console.log(`Created preview URL for ${file.name}:`, url);
          return url;
        });
        setPhotoPreviewUrls(previews);
        console.log('✅ Preview URLs set:', previews);
      } catch (error) {
        console.error('❌ Error creating preview URLs:', error);
      }
    } else {
      console.warn('⚠️ No files in event.target.files');
    }
  };

  const removePhoto = (index: number) => {
    console.log(`🗑️ Removing photo at index ${index}`);
    const newPhotos = photos.filter((_, i) => i !== index);
    const newPreviews = photoPreviewUrls.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    setPhotoPreviewUrls(newPreviews);
    console.log('✅ Photo removed, remaining:', newPhotos.length);
  };

  const handleComplete = async () => {
    console.log('🚀 Starting onboarding completion');
    console.log('Current photos:', photos);
    console.log('Current preferences:', preferences);
    
    setSaving(true);
    
    try {
      // Upload photos first
      const uploadedUrls: string[] = [];
      
      if (photos.length > 0) {
        console.log(`📤 Uploading ${photos.length} photos...`);
        setUploading(true);
        
        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i];
          console.log(`Uploading photo ${i + 1}/${photos.length}:`, photo.name);
          
          const formData = new FormData();
          formData.append('file', photo);
          console.log('FormData created:', formData);
          
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          
          console.log('Upload response status:', uploadResponse.status);
          
          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('❌ Upload failed:', errorText);
            throw new Error('Failed to upload photo');
          }
          
          const uploadData = await uploadResponse.json();
          console.log('✅ Upload successful:', uploadData);
          uploadedUrls.push(uploadData.url);
        }
        
        setUploading(false);
        console.log('✅ All photos uploaded:', uploadedUrls.length);
      } else {
        console.log('ℹ️ No photos to upload');
      }
      
      // Save profile data
      const profileData = {
        name: preferences.name,
        preferences: {
          sizes: {
            top: preferences.topSize,
            bottom: preferences.bottomSize,
          },
          budgetRange: preferences.budgetMin && preferences.budgetMax 
            ? [parseInt(preferences.budgetMin), parseInt(preferences.budgetMax)]
            : undefined,
        },
        photoUrls: uploadedUrls,
        primaryPhotoIndex: 0, // First photo is primary
      };
      
      console.log('💾 Saving profile data:', profileData);
      
      const profileResponse = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      
      console.log('Profile response status:', profileResponse.status);
      
      if (!profileResponse.ok) {
        const errorText = await profileResponse.text();
        console.error('❌ Profile save failed:', errorText);
        throw new Error('Failed to save profile');
      }
      
      const profileResult = await profileResponse.json();
      console.log('✅ Profile saved successfully:', profileResult);
      
      // Success! Redirect to swipe
      console.log('✅ Redirecting to /swipe');
      router.push('/swipe');
    } catch (error) {
      console.error('❌ ERROR completing onboarding:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      alert('Failed to complete onboarding. Please try again.');
    } finally {
      console.log('🏁 Onboarding process finished');
      setSaving(false);
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Welcome to Vesaki</CardTitle>
          <CardDescription>Let's set up your personal styling experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">What's your name?</Label>
                <Input
                  id="name"
                  value={preferences.name}
                  onChange={(e) => setPreferences({ ...preferences, name: e.target.value })}
                  placeholder="Enter your name"
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label>Upload Your Photos (1-5 photos)</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Upload clear, full-body photos for accurate virtual try-on
                </p>
                
                {/* Photo Preview Grid */}
                {photoPreviewUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {photoPreviewUrls.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                        <img 
                          src={url} 
                          alt={`Photo ${index + 1}`} 
                          className="w-full h-full object-cover" 
                        />
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        {index === 0 && (
                          <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                            Primary
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                    max="5"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      {photos.length > 0
                        ? `${photos.length} photo(s) selected - Click to change`
                        : 'Click to upload photos'}
                    </p>
                  </label>
                </div>
              </div>

              <Button
                onClick={() => setStep(2)}
                className="w-full"
                disabled={!preferences.name || photos.length === 0}
              >
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Style Preferences (Optional)</h3>
              <p className="text-sm text-muted-foreground">
                Help us personalize your experience
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="topSize">Top Size</Label>
                  <Input
                    id="topSize"
                    value={preferences.topSize}
                    onChange={(e) => setPreferences({ ...preferences, topSize: e.target.value })}
                    placeholder="S, M, L, XL"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="bottomSize">Bottom Size</Label>
                  <Input
                    id="bottomSize"
                    value={preferences.bottomSize}
                    onChange={(e) => setPreferences({ ...preferences, bottomSize: e.target.value })}
                    placeholder="28, 30, 32"
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label>Budget Range</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <Input
                    value={preferences.budgetMin}
                    onChange={(e) => setPreferences({ ...preferences, budgetMin: e.target.value })}
                    placeholder="Min ($)"
                    type="number"
                  />
                  <Input
                    value={preferences.budgetMax}
                    onChange={(e) => setPreferences({ ...preferences, budgetMax: e.target.value })}
                    placeholder="Max ($)"
                    type="number"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  onClick={handleComplete} 
                  className="flex-1"
                  disabled={saving || uploading}
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <SkipForward className="mr-2 h-4 w-4" />
                  )}
                  {saving ? 'Saving...' : 'Skip'}
                </Button>
                <Button 
                  onClick={handleComplete} 
                  className="flex-1"
                  disabled={saving || uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Complete Setup'
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
