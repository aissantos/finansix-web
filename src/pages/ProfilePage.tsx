import { useNavigate } from 'react-router-dom';
import { Bell, Lock, Palette, HelpCircle, MessageCircle, FileText, LogOut, ChevronRight, Users } from 'lucide-react';
import { Header, PageContainer } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Usuário';
  const email = user?.email || '';

  return (
    <>
      <Header title="Perfil" />
      <PageContainer className="space-y-6 pt-6">
        {/* Profile Header */}
        <section className="flex flex-col items-center gap-4 py-4">
          <div className="relative">
            <div className="h-28 w-28 rounded-full shadow-lg ring-4 ring-white dark:ring-slate-700 bg-primary flex items-center justify-center text-white text-4xl font-bold">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <button className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 shadow-md hover:scale-110 transition-transform">
              <Palette className="h-4 w-4" />
            </button>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{displayName}</h2>
            <p className="text-slate-500 text-sm font-medium">{email}</p>
          </div>
          <Button variant="secondary" size="sm">
            Editar Dados
          </Button>
        </section>

        {/* Household Section */}
        <section>
          <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider px-2 mb-2">
            Família (Household)
          </h3>
          <Card className="p-4 flex items-center justify-between">
            <div className="flex items-center -space-x-2">
              <div className="h-10 w-10 rounded-full border-2 border-white dark:border-slate-800 bg-primary flex items-center justify-center text-white text-sm font-bold">
                {displayName.charAt(0)}
              </div>
              <div className="h-10 w-10 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <Users className="h-4 w-4 text-slate-400" />
              </div>
            </div>
            <button className="flex items-center gap-1 bg-slate-50 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-200 transition-all hover:bg-slate-100">
              Gerenciar
              <ChevronRight className="h-4 w-4" />
            </button>
          </Card>
        </section>

        {/* Settings Section */}
        <section>
          <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider px-2 mb-2">
            Configurações
          </h3>
          <Card className="divide-y dark:divide-slate-700 overflow-hidden">
            <SettingItem
              icon={<Bell className="h-5 w-5" />}
              iconBg="bg-blue-100 text-primary"
              label="Notificações"
              hasToggle
            />
            <SettingItem
              icon={<Lock className="h-5 w-5" />}
              iconBg="bg-green-100 text-green-600"
              label="Segurança"
              sublabel="FaceID & PIN"
            />
            <SettingItem
              icon={<Palette className="h-5 w-5" />}
              iconBg="bg-purple-100 text-purple-600"
              label="Aparência"
              sublabel="Sistema"
            />
          </Card>
        </section>

        {/* Support Section */}
        <section>
          <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider px-2 mb-2">
            Suporte
          </h3>
          <Card className="divide-y dark:divide-slate-700 overflow-hidden">
            <SettingItem
              icon={<HelpCircle className="h-5 w-5" />}
              iconBg="bg-slate-100 text-slate-600"
              label="Central de Ajuda"
            />
            <SettingItem
              icon={<MessageCircle className="h-5 w-5" />}
              iconBg="bg-slate-100 text-slate-600"
              label="Fale Conosco"
            />
            <SettingItem
              icon={<FileText className="h-5 w-5" />}
              iconBg="bg-slate-100 text-slate-600"
              label="Termos de Uso"
            />
          </Card>
        </section>

        {/* Logout */}
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair da conta
        </Button>

        <p className="text-center text-slate-300 text-[10px] font-bold pb-8">
          Finansix v1.0.0
        </p>
      </PageContainer>
    </>
  );
}

function SettingItem({
  icon,
  iconBg,
  label,
  sublabel,
  hasToggle,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  sublabel?: string;
  hasToggle?: boolean;
}) {
  return (
    <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        <div className="flex flex-col items-start">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">{label}</span>
          {sublabel && (
            <span className="text-[10px] font-medium text-slate-400">{sublabel}</span>
          )}
        </div>
      </div>
      {hasToggle ? (
        <div className="w-11 h-6 bg-primary rounded-full relative flex items-center px-1">
          <div className="h-4 w-4 bg-white rounded-full shadow-sm ml-auto" />
        </div>
      ) : (
        <ChevronRight className="h-5 w-5 text-slate-300" />
      )}
    </button>
  );
}
