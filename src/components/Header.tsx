import { Pizza } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-orange-100">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-3">
          <Pizza className="w-8 h-8 text-orange-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pizza Dough Calculator</h1>
            <p className="text-sm text-gray-600 mt-1">Calculate perfect pizza dough ingredients with precision</p>
          </div>
        </div>
      </div>
    </header>
  );
}
