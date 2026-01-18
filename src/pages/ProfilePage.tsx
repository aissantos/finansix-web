import { useNavigate } from 'react-router-dom';
import { Bell, Lock, Palette, HelpCircle, MessageCircle, FileText, LogOut, ChevronRight, Users, Tag, Zap } from 'lucide-react';
import { Header, PageContainer } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AvatarUploader } from '@/components/features';
import { useAuth, useHouseholdMembers } from '@/hooks';
import { useAppStore } from '@/stores';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: members } = useHouseholdMembers();

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
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <>
      <Header title="Perfil" />
      <PageContainer className="space-y-6 pt-6">
        {/* Profile Header */}
        <section className="flex flex-col items-center gap-4 py-4">
          <AvatarUploader
            currentUrl={avatarUrl}
            displayName={displayName}
            size="lg"
          />
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{displayName}</h2>
            <p className="text-slate-500 text-sm font-medium">{email}</p>
          </div>
        </section>

        {/* Household Section */}
        <section>
          <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider px-2 mb-2">
            Família (Household)
          </h3>
          <Card 
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            onClick={() => navigate('/household')}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center -space-x-2">
                {members?.slice(0, 3).map((member, i) => (
                  <div 
                    key={member.id}
                    className="h-10 w-10 rounded-full border-2 border-white dark:border-slate-800 bg-primary flex items-center justify-center text-white text-sm font-bold"
                    style={{ zIndex: 3 - i }}
                  >
                    {(member.display_name || 'U').charAt(0).toUpperCase()}
                  </div>
                ))}
                {(!members || members.length === 0) && (
                  <div className="h-10 w-10 rounded-full border-2 border-white dark:border-slate-800 bg-primary flex items-center justify-center text-white text-sm font-bold">
                    {displayName.charAt(0)}
                  </div>
                )}
                <div className="h-10 w-10 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                  <Users className="h-4 w-4 text-slate-400" />
                </div>
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">
                  {members?.length || 1} membro{(members?.length || 1) !== 1 ? 's' : ''}
                </p>
                <p className="text-[10px] text-slate-500">Toque para gerenciar</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-300" />
          </Card>
        </section>

        {/* Data Management Section */}
        <section>
          <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider px-2 mb-2">
            Gestão de Dados
          </h3>
          <Card className="divide-y dark:divide-slate-700 overflow-hidden">
            <SettingItem
              icon={<Tag className="h-5 w-5" />}
              iconBg="bg-amber-100 text-amber-600"
              label="Categorias"
              sublabel="Gerir categorias de transações"
              onClick={() => navigate('/categories')}
            />
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
            <FABToggleItem />
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
          Finansix v2.0.0
        </p>
      </PageContainer>
    </>
  );
}

function FABToggleItem() {
  const showFAB = useAppStore((state) => state.showFAB);
  const setShowFAB = useAppStore((state) => state.setShowFAB);

  return (
    <button 
      onClick={() => setShowFAB(!showFAB)}
      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-orange-100 text-orange-600">
          <Zap className="h-5 w-5" />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">Botão Flutuante</span>
          <span className="text-[10px] font-medium text-slate-400">Ações rápidas</span>
        </div>
      </div>
      <div className={`w-11 h-6 rounded-full relative flex items-center px-1 transition-colors ${showFAB ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}>
        <div className={`h-4 w-4 bg-white rounded-full shadow-sm transition-transform ${showFAB ? 'ml-auto' : ''}`} />
      </div>
    </button>
  );
}

function SettingItem({
  icon,
  iconBg,
  label,
  sublabel,
  hasToggle,
  onClick,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  sublabel?: string;
  hasToggle?: boolean;
  onClick?: () => void;
}) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
    >
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
