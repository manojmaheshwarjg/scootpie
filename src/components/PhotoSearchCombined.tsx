'use client';

import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function PhotoSearchCombined() {
  const router = useRouter();
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [gender, setGender] = useState('Unisex');
  const [style, setStyle] = useState('All Styles');
  const [uploading, setUploading] = useState(false);

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Calculate new dimensions (max 800x800 while maintaining aspect ratio)
          let width = img.width;
          let height = img.height;
          const maxSize = 800;

          if (width > height && width > maxSize) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width / height) * maxSize;
            height = maxSize;
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to blob with compression
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            'image/jpeg',
            0.7 // 70% quality
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      try {
        // Compress the image before storing
        console.log('[LANDING] Original file size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
        const compressedFile = await compressImage(file);
        console.log('[LANDING] Compressed file size:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');
        
        setPhoto(compressedFile);
        const url = URL.createObjectURL(compressedFile);
        setPhotoPreview(url);
      } catch (error) {
        console.error('[LANDING] Error compressing image:', error);
        alert('Failed to process image. Please try another photo.');
      }
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview(null);
    // Clear search query when photo is removed
    setSearchQuery('');
  };

  const handleSearch = async () => {
    if (!photo || !searchQuery.trim()) return;
    
    console.log('[LANDING] 📤 Starting search process');
    console.log('[LANDING] Photo:', photo?.name, photo?.size);
    console.log('[LANDING] Query:', searchQuery);
    console.log('[LANDING] Gender:', gender);
    console.log('[LANDING] Style:', style);
    
    setUploading(true);
    try {
      // Upload photo first
      const formData = new FormData();
      formData.append('file', photo);
      
      console.log('[LANDING] Uploading photo to /api/upload...');
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        console.error('[LANDING] Upload failed:', uploadResponse.status, uploadResponse.statusText);
        throw new Error('Failed to upload photo');
      }
      
      const uploadData = await uploadResponse.json();
      const photoUrl = uploadData.url;
      
      console.log('[LANDING] ✅ Photo uploaded successfully');
      console.log('[LANDING] Photo URL (first 100 chars):', photoUrl.substring(0, 100));
      
      // Store photo URL and search query in sessionStorage to pass to onboarding
      sessionStorage.setItem('landingPhotoUrl', photoUrl);
      sessionStorage.setItem('landingSearchQuery', searchQuery);
      sessionStorage.setItem('landingGender', gender);
      sessionStorage.setItem('landingStyle', style);
      
      console.log('[LANDING] ✅ Stored in sessionStorage:');
      console.log('[LANDING] - landingPhotoUrl:', photoUrl.substring(0, 50) + '...');
      console.log('[LANDING] - landingSearchQuery:', searchQuery);
      console.log('[LANDING] - landingGender:', gender);
      console.log('[LANDING] - landingStyle:', style);
      
      // Redirect to sign-up (which will redirect to onboarding)
      console.log('[LANDING] Redirecting to /sign-up');
      router.push('/sign-up');
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo. Please try again.');
      setUploading(false);
    }
  };

  const isSearchDisabled = !photo || !searchQuery.trim() || uploading;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Combined Photo Upload and Search Section */}
      <div className="bg-white rounded-3xl border-2 border-gray-300 shadow-xl hover:border-[#8B5CF6] focus-within:border-[#8B5CF6] transition-all overflow-hidden">
        <div className="p-6 md:p-10">
          {/* Step 1: Photo Upload */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                  Step 1: Upload Your Photo <span className="text-red-500">*</span>
                </h3>
                <p className="text-sm text-gray-600">
                  See how clothes look on <span className="font-semibold text-[#8B5CF6]">you</span> with AI try-on
                </p>
              </div>
              {photoPreview && (
                <button
                  onClick={removePhoto}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Remove photo"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {photoPreview ? (
              <div className="relative w-full max-w-xs mx-auto aspect-square rounded-xl overflow-hidden border-2 border-[#8B5CF6] mb-4">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-[#8B5CF6] text-white text-xs px-2 py-1 rounded-lg font-medium">
                  Photo Uploaded ✓
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#8B5CF6] hover:bg-gray-50 transition-all cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#8B5CF6]/10 to-[#7C3AED]/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Upload className="h-8 w-8 md:h-10 md:w-10 text-[#8B5CF6]/60" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Click to upload your photo
                  </p>
                  <p className="text-xs text-gray-500">
                    Supports JPG, PNG • Max 10MB
                  </p>
                </label>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white text-sm text-gray-500 font-medium">
                Step 2: Search for your style
              </span>
            </div>
          </div>

          {/* Step 2: Search */}
          <div className={!photo ? 'opacity-50 pointer-events-none' : ''}>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Describe what you're looking for <span className="text-red-500">*</span>
            </label>
            <textarea
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={!photo ? 'Upload a photo first to enable search' : "Try: 'Show me a black leather jacket from Zara' or 'I need a red Gucci handbag for a wedding'"}
              rows={3}
              className="w-full text-base md:text-lg text-gray-900 placeholder-gray-400 resize-none focus:outline-none border border-gray-300 rounded-lg p-3 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={!photo || uploading}
              required
            />

            {/* Filters and Button */}
            <div className="flex flex-col gap-3 pt-4 border-t border-gray-200 mt-4">
              {/* Filters Row */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-1 min-w-[140px]">
                  <span className="text-xs md:text-sm text-gray-600 font-medium whitespace-nowrap">Gender:</span>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border-0 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!photo || uploading}
                  >
                    <option>Unisex</option>
                    <option>Women</option>
                    <option>Men</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-[140px]">
                  <span className="text-xs md:text-sm text-gray-600 font-medium whitespace-nowrap">Style:</span>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border-0 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!photo || uploading}
                  >
                    <option>All Styles</option>
                    <option>Casual</option>
                    <option>Formal</option>
                    <option>Streetwear</option>
                    <option>Luxury</option>
                    <option>Vintage</option>
                  </select>
                </div>
              </div>

              {/* Search Button */}
              <button
                onClick={handleSearch}
                disabled={isSearchDisabled}
                className="relative w-full px-5 py-2.5 bg-gradient-to-r from-[#8B5CF6]/90 to-[#7C3AED]/90 text-white rounded-xl hover:from-[#8B5CF6] hover:to-[#7C3AED] transition-all font-medium text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 group overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                style={{
                  background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.9), rgba(124, 58, 237, 0.9))',
                }}
              >
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 disabled:opacity-0"
                  style={{
                    background: 'linear-gradient(90deg, #8B5CF6, #7C3AED, #8B5CF6)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s linear infinite'
                  }}
                ></div>
                <span className="relative z-10">
                  {uploading ? 'Uploading...' : !photo ? 'Upload a photo to search' : !searchQuery.trim() ? 'Enter a search query' : 'Search & Get Started'}
                </span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Helper text */}
          {!photo && (
            <p className="text-xs text-gray-500 mt-4 text-center flex items-center justify-center gap-2">
              <svg className="w-4 h-4 text-[#8B5CF6]/40" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Your photos are private and secure
            </p>
          )}
        </div>
      </div>
    </div>
  );
}


