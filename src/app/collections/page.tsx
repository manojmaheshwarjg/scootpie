'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getMockProducts } from '@/lib/mock-data/products';
import { formatPrice } from '@/lib/utils';
import { Heart, Plus, ExternalLink, Search, Trash2 } from 'lucide-react';
import { Navigation } from '@/components/Navigation';

export default function CollectionsPage() {
  const [collections, setCollections] = useState([
    { id: '1', name: 'Likes', isDefault: true, items: getMockProducts(3) },
    { id: '2', name: 'Work Outfits', isDefault: false, items: [] },
    { id: '3', name: 'Summer Wardrobe', isDefault: false, items: getMockProducts(2) },
  ]);
  const [selectedCollection, setSelectedCollection] = useState(collections[0]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showNewCollection, setShowNewCollection] = useState(false);

  const createCollection = () => {
    if (newCollectionName.trim()) {
      const newCollection = {
        id: Date.now().toString(),
        name: newCollectionName,
        isDefault: false,
        items: [],
      };
      setCollections([...collections, newCollection]);
      setNewCollectionName('');
      setShowNewCollection(false);
    }
  };

  return (
    <>
    <div className="min-h-screen bg-gray-50 pb-16 lg:pb-0 lg:pl-72">
      <div className="lg:px-8 lg:py-8 p-6">
        {/* Desktop Header */}
        <div className="hidden lg:block mb-8 bg-white rounded-3xl p-8 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-gray-900">My Collections</h1>
              <p className="text-gray-600 mt-2">Organize your favorite fashion finds</p>
            </div>
            <Button onClick={() => setShowNewCollection(true)} className="rounded-full px-6 py-6 text-base">
              <Plus className="mr-2 h-5 w-5" />
              New Collection
            </Button>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My Collections</h1>
          <Button onClick={() => setShowNewCollection(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Collection
          </Button>
        </div>

        {showNewCollection && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-2">
                <Input
                  placeholder="Collection name"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && createCollection()}
                />
                <Button onClick={createCollection}>Create</Button>
                <Button variant="outline" onClick={() => setShowNewCollection(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {collections.map((collection) => (
            <Button
              key={collection.id}
              variant={selectedCollection.id === collection.id ? 'default' : 'outline'}
              onClick={() => setSelectedCollection(collection)}
              className="whitespace-nowrap"
            >
              {collection.isDefault && <Heart className="mr-2 h-4 w-4" />}
              {collection.name}
              <span className="ml-2 text-xs">({collection.items.length})</span>
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {selectedCollection.items.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition">
              <div className="relative h-80">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{item.brand}</p>
                <div className="flex items-center justify-between mb-4">
                  <p className="font-bold text-lg">{formatPrice(item.price, item.currency)}</p>
                  <p className="text-sm text-gray-500">{item.retailer}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Buy Now
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedCollection.items.length === 0 && (
          <div className="text-center py-16">
            <Heart className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No items yet</h3>
            <p className="text-gray-500">
              Start swiping to add items to this collection
            </p>
          </div>
        )}
      </div>
    </div>
    <Navigation />
    </>
  );
}
