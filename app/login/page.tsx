import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 font-vazir mb-2">
            رابین تجارت
          </h1>
          <p className="text-gray-600 font-vazir">
            سیستم مدیریت ارتباط با مشتری
          </p>
        </div>
        
        <LoginForm />
      </div>
    </div>
  );
}