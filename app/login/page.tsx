import LoginForm from '@/components/auth/LoginForm';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="w-full max-w-[400px] px-4">
        <div className="mb-8 text-center">
          <div className="w-[180px] h-[180px] mx-auto mb-4 relative">
            <Image
              src="https://uploadkon.ir/uploads/5c1f19_25x-removebg-preview.png"
              alt="رابین تجارت"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold font-vazir bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            رابین تجارت
          </h1>
          <p className="text-muted-foreground mt-2 font-vazir">
            سیستم مدیریت ارتباط با مشتری
          </p>
        </div>
        
        <LoginForm />
      </div>
    </div>
  );
}