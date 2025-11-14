'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Upload, ArrowRight, Loader2, X } from 'lucide-react';
import Image from 'next/image';

export default function OnboardingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState(1);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    gender: '',
    topSize: '',
    bottomSize: '',
    shoeSize: '',
    budgetMin: '',
    budgetMax: '',
  });

  // Check for landing page data first, then handle existing profiles
  useEffect(() => {
    const handleOnboarding = async () => {
      try {
        // Check if photo was uploaded from landing page FIRST
        const landingPhotoUrl = sessionStorage.getItem('landingPhotoUrl');
        const landingGender = sessionStorage.getItem('landingGender');
        
        console.log('[ONBOARDING] Checking landing page data:', { 
          hasPhoto: !!landingPhotoUrl, 
          hasGender: !!landingGender 
        });
        
        // Check if user already has a profile
        const res = await fetch('/api/user/profile', { cache: 'no-store' });
        const isExistingUser = res.ok;
        
        console.log('[ONBOARDING] Is existing user?', isExistingUser);
        
        if (isExistingUser && (landingPhotoUrl || landingGender)) {
          // Existing user with landing page data - update their profile
          console.log('[ONBOARDING] Existing user with landing data - updating profile...');
          
          const profileData: any = {
            preferences: {},
          };
          
          // Add photo if available (it will become the primary photo)
          if (landingPhotoUrl) {
            profileData.photoUrls = [landingPhotoUrl];
            profileData.primaryPhotoIndex = 0; // New photo is primary
            console.log('[ONBOARDING] Adding photo for existing user');
          }
          
          // Add gender if available (it will override existing)
          if (landingGender) {
            const genderMap: Record<string, string> = {
              'Men': 'men',
              'Women': 'women',
              'Unisex': 'unisex',
            };
            const mappedGender = genderMap[landingGender] || landingGender.toLowerCase();
            profileData.preferences.gender = mappedGender;
            console.log('[ONBOARDING] Adding gender for existing user:', mappedGender);
          }
          
          // Update profile via API
          const updateRes = await fetch('/api/user/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData),
          });
          
          if (updateRes.ok) {
            console.log('[ONBOARDING] ✅ Profile updated for existing user');
          } else {
            console.error('[ONBOARDING] Failed to update profile:', updateRes.status);
          }
          
          // Clear photo and gender from sessionStorage (already saved)
          // Keep search query and style for use in /swipe page
          sessionStorage.removeItem('landingPhotoUrl');
          sessionStorage.removeItem('landingGender');
          console.log('[ONBOARDING] Keeping search query for /swipe:', sessionStorage.getItem('landingSearchQuery'));
          
          // Redirect to swipe
          router.replace('/swipe');
          return;
        } else if (isExistingUser) {
          // Existing user without landing data - just redirect
          console.log('[ONBOARDING] Existing user without landing data - redirecting to swipe');
          router.replace('/swipe');
          return;
        }
        
        // New user - populate form with landing data if available
        if (landingPhotoUrl) {
          console.log('[ONBOARDING] New user - populating form with landing data');
          setPhotoPreviewUrls([landingPhotoUrl]);
          
          if (landingGender) {
            const genderMap: Record<string, string> = {
              'Men': 'men',
              'Women': 'women',
              'Unisex': 'unisex',
            };
            const mappedGender = genderMap[landingGender] || landingGender.toLowerCase();
            setPreferences(prev => ({ ...prev, gender: mappedGender }));
            console.log('📝 [ONBOARDING] Populated gender from landing page:', mappedGender);
          }
          
          // Don't clear sessionStorage yet - will be cleared after completing onboarding
        }
      } catch (e) {
        console.error('[ONBOARDING] Error:', e);
      } finally {
        setChecking(false);
      }
    };
    
    handleOnboarding();
  }, [router]);

  // Debug: Monitor state changes
  useEffect(() => {
    console.log('🔄 State changed - photos:', photos.length, 'previews:', photoPreviewUrls.length);
    console.log('Preview URLs:', photoPreviewUrls);
    console.log('Should show preview grid?', photoPreviewUrls.length > 0);
  }, [photos, photoPreviewUrls]);

  // Show loader while checking if user has completed onboarding
  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-100 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-900 mx-auto mb-4" />
          <p className="text-lg text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📸 Photo upload triggered');
    console.log('Files from event:', e.target.files ? e.target.files.length : 0, 'files');
    
    if (e.target.files) {
      let files = Array.from(e.target.files);
      console.log('✅ Files array:', files);
      console.log('Number of files:', files.length);
      
      // Enforce max 5 photos
      if (files.length > 5) {
        alert('You can upload a maximum of 5 photos. We will use the first 5.');
        files = files.slice(0, 5);
      }
      
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
    console.log('Current preferences:', JSON.stringify(preferences, null, 2));
    console.log('Preview URLs:', photoPreviewUrls.length, photoPreviewUrls.map(url => url.substring(0, 50)));
    
    // Validate gender is set
    if (!preferences.gender || preferences.gender.trim() === '') {
      alert('Please select your gender before completing setup.');
      return;
    }
    
    setSaving(true);
    
    try {
      // Upload photos first (or use already uploaded URLs from landing page)
      const uploadedUrls: string[] = [];
      
      // Check if we have preview URLs that are already uploaded (from landing page)
      // Data URLs (data:image/...) are already "uploaded" as base64, HTTP URLs are from external storage
      const hasLandingPhoto = photoPreviewUrls.length > 0 && (
        photoPreviewUrls[0].startsWith('http') || 
        photoPreviewUrls[0].startsWith('data:')
      );
      
      console.log('[ONBOARDING] Photo check:', {
        previewUrlsCount: photoPreviewUrls.length,
        firstPreviewUrl: photoPreviewUrls[0]?.substring(0, 50) || 'none',
        hasLandingPhoto,
        photosCount: photos.length,
      });
      
      if (hasLandingPhoto) {
        // Photo was already uploaded from landing page (data URL or HTTP URL), use it directly
        uploadedUrls.push(...photoPreviewUrls);
        console.log('✅ Using photo from landing page:', uploadedUrls.length, 'Type:', photoPreviewUrls[0].startsWith('data:') ? 'data URL' : 'HTTP URL');
      } else if (photos.length > 0) {
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
      
      // Validate we have photos
      if (uploadedUrls.length === 0) {
        throw new Error('No photos to save. Please upload at least one photo.');
      }
      
      // Save profile data - only include non-empty values
      const profileData: any = {
        photoUrls: uploadedUrls,
        primaryPhotoIndex: uploadedUrls.length - 1, // Most recently uploaded photo is primary
        preferences: {},
      };
      
      // Gender is required - should always be set by this point
      if (preferences.gender && preferences.gender.trim() !== '' && preferences.gender !== 'prefer-not-to-say') {
        profileData.preferences.gender = preferences.gender.trim();
        console.log('[ONBOARDING] Adding gender to profile:', preferences.gender.trim());
      } else {
        console.warn('[ONBOARDING] No gender provided, but button should have been disabled!');
        throw new Error('Gender is required for onboarding');
      }
      
      // Only add sizes if at least one is set and not empty
      const sizes: any = {};
      if (preferences.topSize && preferences.topSize.trim() !== '') {
        sizes.top = preferences.topSize.trim();
        console.log('[ONBOARDING] Adding top size:', preferences.topSize.trim());
      }
      if (preferences.bottomSize && preferences.bottomSize.trim() !== '') {
        sizes.bottom = preferences.bottomSize.trim();
        console.log('[ONBOARDING] Adding bottom size:', preferences.bottomSize.trim());
      }
      if (preferences.shoeSize && preferences.shoeSize.trim() !== '') {
        sizes.shoes = preferences.shoeSize.trim();
        console.log('[ONBOARDING] Adding shoe size:', preferences.shoeSize.trim());
      }
      if (Object.keys(sizes).length > 0) {
        profileData.preferences.sizes = sizes;
      }
      
      // Only add budget range if both min and max are set
      if (preferences.budgetMin && preferences.budgetMax) {
        const min = parseInt(preferences.budgetMin);
        const max = parseInt(preferences.budgetMax);
        if (!isNaN(min) && !isNaN(max) && min > 0 && max > 0) {
          profileData.preferences.budgetRange = [min, max];
          console.log('[ONBOARDING] Adding budget range:', [min, max]);
        }
      }
      
      console.log('💾 Saving profile data:', JSON.stringify(profileData, null, 2));
      console.log('💾 Preferences being saved:', JSON.stringify(profileData.preferences, null, 2));
      console.log('💾 Photo URLs being saved:', uploadedUrls.length, uploadedUrls.map(url => url.substring(0, 50) + '...'));
      
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
      console.log('✅ Profile saved successfully:', JSON.stringify(profileResult, null, 2));
      console.log('✅ Saved user preferences:', JSON.stringify(profileResult.user?.preferences, null, 2));
      console.log('✅ Saved user photos count:', profileResult.user?.photos?.length || 0);
      if (profileResult.user?.photos) {
        console.log('✅ Saved photo URLs:', profileResult.user.photos.map((p: any) => p.url.substring(0, 50) + '...'));
      }
      
      // Clear photo and gender from sessionStorage (already saved)
      // Keep search query and style for use in /swipe page
      sessionStorage.removeItem('landingPhotoUrl');
      sessionStorage.removeItem('landingGender');
      console.log('[ONBOARDING] Cleared photo/gender, keeping search query for /swipe:', sessionStorage.getItem('landingSearchQuery'));
      
      // Success! Redirect to swipe page
      console.log('✅ Redirecting to /swipe');
      router.replace('/swipe');
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
    <div className="min-h-screen bg-gradient-to-b from-indigo-100 via-purple-50 to-pink-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8">
        <div className="mb-6">
          <h1 className="text-5xl font-serif font-normal tracking-tight text-gray-900 mb-2">Welcome to Vesaki</h1>
          <p className="text-xl text-gray-700">Let's set up your personal styling experience</p>
        </div>
        <div className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
                <Label>Upload Your Photos (Required - 1-5 photos)</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Upload clear, full-body photos for accurate virtual try-on
                </p>
                
                {/* Photo Preview Grid */}
                {photoPreviewUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {photoPreviewUrls.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-[#E5E5E5]">
                        <img 
                          src={url} 
                          alt={`Photo ${index + 1}`} 
                          className="w-full h-full object-cover" 
                        />
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute top-2 right-2 bg-white text-[#1A1A1A] rounded-full p-1.5 hover:bg-[#FAFAFA] transition shadow-sm"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        {index === 0 && (
                          <div className="absolute bottom-2 left-2 bg-[#1A1A1A] text-white text-xs px-2 py-1 rounded-lg font-medium">
                            Primary
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="border-2 border-dashed border-[#E5E5E5] rounded-xl p-8 text-center hover:border-[#1A1A1A] hover:bg-[#FAFAFA] transition cursor-pointer">
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
                    <Upload className="mx-auto h-12 w-12 text-[#6B6B6B]" />
                    <p className="mt-2 text-sm text-[#6B6B6B]">
                      {photos.length > 0
                        ? `${photos.length} photo(s) selected - Click to change`
                        : 'Click to upload photos'}
                    </p>
                  </label>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="w-full rounded-lg bg-[#1A1A1A] px-6 py-3 text-sm font-medium text-white hover:bg-[#2A2A2A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={photos.length === 0 && photoPreviewUrls.length === 0}
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[#1A1A1A]">Style Preferences</h3>
              <p className="text-sm text-[#6B6B6B]">
                Complete your profile to get personalized recommendations
              </p>

              <div>
                <Label htmlFor="gender" className="text-xs font-medium text-[#1A1A1A]">Gender <span className="text-red-500">*</span></Label>
                <Select
                  id="gender"
                  value={preferences.gender}
                  onChange={(e) => setPreferences({ ...preferences, gender: e.target.value })}
                  className="mt-2"
                  required
                >
                  <option value="">Select gender</option>
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="unisex">Unisex</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="topSize" className="text-xs font-medium text-[#1A1A1A]">Top Size</Label>
                  <Select
                  id="topSize"
                  value={preferences.topSize}
                  onChange={(e) => setPreferences({ ...preferences, topSize: e.target.value })}
                    className="mt-2"
                  >
                    <option value="">Select size</option>
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                    <option value="2X">2X</option>
                    <option value="3X">3X</option>
                  </Select>
              </div>
              <div>
                <Label htmlFor="bottomSize" className="text-xs font-medium text-[#1A1A1A]">Bottom Size</Label>
                  <Select
                  id="bottomSize"
                  value={preferences.bottomSize}
                  onChange={(e) => setPreferences({ ...preferences, bottomSize: e.target.value })}
                    className="mt-2"
                  >
                    <option value="">Select size</option>
                    <option value="26">26</option>
                    <option value="28">28</option>
                    <option value="30">30</option>
                    <option value="32">32</option>
                    <option value="34">34</option>
                    <option value="36">36</option>
                    <option value="38">38</option>
                    <option value="40">40</option>
                    <option value="42">42</option>
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="shoeSize" className="text-xs font-medium text-[#1A1A1A]">Shoe Size (US)</Label>
                <Select
                  id="shoeSize"
                  value={preferences.shoeSize}
                  onChange={(e) => setPreferences({ ...preferences, shoeSize: e.target.value })}
                  className="mt-2"
                >
                  <option value="">Select size</option>
                  <option value="5">5</option>
                  <option value="5.5">5.5</option>
                  <option value="6">6</option>
                  <option value="6.5">6.5</option>
                  <option value="7">7</option>
                  <option value="7.5">7.5</option>
                  <option value="8">8</option>
                  <option value="8.5">8.5</option>
                  <option value="9">9</option>
                  <option value="9.5">9.5</option>
                  <option value="10">10</option>
                  <option value="10.5">10.5</option>
                  <option value="11">11</option>
                  <option value="11.5">11.5</option>
                  <option value="12">12</option>
                  <option value="12.5">12.5</option>
                  <option value="13">13</option>
                  <option value="13.5">13.5</option>
                  <option value="14">14</option>
                  <option value="15">15</option>
                </Select>
            </div>

            <div>
              <Label className="text-xs font-medium text-[#1A1A1A]">Budget Range</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Input
                  value={preferences.budgetMin}
                  onChange={(e) => setPreferences({ ...preferences, budgetMin: e.target.value })}
                  placeholder="Min ($)"
                  type="number"
                  className="rounded-lg border border-[#E5E5E5] focus:border-[#1A1A1A]"
                />
                <Input
                  value={preferences.budgetMax}
                  onChange={(e) => setPreferences({ ...preferences, budgetMax: e.target.value })}
                  placeholder="Max ($)"
                  type="number"
                  className="rounded-lg border border-[#E5E5E5] focus:border-[#1A1A1A]"
                />
                </div>
              </div>

                <button 
                  onClick={handleComplete} 
                className="w-full rounded-lg bg-[#1A1A1A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#2A2A2A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={saving || uploading || !preferences.gender}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Uploading...
                    </>
                  ) : saving ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Complete Setup'
                  )}
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
