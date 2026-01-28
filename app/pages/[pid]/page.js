'use client';
import Dashboard from "@/app/pageComponents/Dashboard";
import { useParams } from "next/navigation";
import CreateImage from "@/app/components/CreateImage";
import ItemRegistoration from "@/app/components/ItemRegistoration";
import SelectionPage from "@/app/components/SelectionPage";
import BaggageImageGallery from "@/app/components/BaggageImageGallery";
import AreaGallerySelection from "@/app/components/AreaGallerySelection";
import CorrectiveList from "@/app/components/CorrectiveList";

export default function DynamicPage() {
  const { pid } = useParams();

  // ✅ mapping component ตามชื่อ path
  const renderContent = () => {
    switch (pid) {
      case 'dashboard':
        return <Dashboard />
      case 'createimage':
        return <CreateImage />
      case 'ItemRegistoration':
        return <ItemRegistoration />
      case 'selection':
        return <SelectionPage />
         case 'selection':
        return <SelectionPage />
      case 'gallery':
        return <AreaGallerySelection />
        case 'baggagegallery':
        return <BaggageImageGallery />
        case 'CorrectiveList':
        return <CorrectiveList />
      default:
        return (
          <div className="p-1 text-center text-slate-500  overflow-hidden">
            <h2 className="text-2xl font-semibold mb-2">404 - Page Not Found</h2>
            <p>There is no module named "{page}".</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen p-1">
      {renderContent()}
    </div>
  );
}
