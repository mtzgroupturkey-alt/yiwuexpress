'use client';

import React from 'react';
import { Tag, Sparkles, ArrowRight, HelpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCompanyName } from '@/hooks/useCompanyName';
import { useStorefrontTranslation } from '@/hooks/useStorefrontTranslation';
import { useSettings } from '@/components/SettingsProvider';

interface MemberClubBannerProps {
  onActivateMembership: () => void;
  onHowPointsWork: () => void;
}

export const MemberClubBanner: React.FC<MemberClubBannerProps> = ({
  onActivateMembership,
  onHowPointsWork,
}) => {
  const router = useRouter();
  const companyName = useCompanyName();
  const { settings } = useSettings();
  const { tMemberClub } = useStorefrontTranslation();

  if (settings?.memberClubEnabled === false) {
    return null;
  }

  const handleActivateClick = () => {
    if (settings?.memberClubActivateLink) {
      router.push(settings.memberClubActivateLink);
    } else {
      onActivateMembership();
    }
  };

  const handlePointsClick = () => {
    if (settings?.memberClubHowPointsLink) {
      router.push(settings.memberClubHowPointsLink);
    } else {
      onHowPointsWork();
    }
  };

  const description = (
    settings?.memberClubDescription ||
    tMemberClub('description', { name: companyName })
  ).replace('{name}', companyName);

  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 lg:px-6 py-4">
      <div 
        className="rounded-2xl p-6 sm:p-7 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-sm"
        style={{
          background: 'linear-gradient(135deg, #072648 0%, #00407a 100%)'
        }}
      >
        {/* Subtle background glow */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-blue-400/10 pointer-events-none blur-xl"></div>

        {/* Content with icon */}
        <div className="flex items-start gap-4 z-10">
          <div className="w-14 h-14 rounded-2xl bg-[#F5A602] flex items-center justify-center text-slate-950 shrink-0 shadow-md">
            <Tag className="w-7 h-7 stroke-[2.2]" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="bg-amber-400/20 text-amber-300 border border-amber-300/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {settings?.memberClubBadge || tMemberClub('badge')}
              </span>
              <span className="text-blue-200 text-xs font-medium">
                • {settings?.memberClubMembersCount || tMemberClub('membersCount')}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {settings?.memberClubTitle || tMemberClub('title')}
            </h3>
            <p className="text-xs sm:text-sm text-blue-100/90 mt-1 max-w-[650px] leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 z-10 self-start md:self-auto shrink-0 flex-wrap">
          <button
            id="activate-membership-btn"
            onClick={handleActivateClick}
            className="bg-[#F5A602] hover:bg-[#E09500] active:scale-95 text-slate-950 font-bold px-5 py-2.5 rounded-lg text-xs sm:text-sm transition-all cursor-pointer shadow-md"
          >
            {settings?.memberClubActivateBtn || tMemberClub('activateBtn')}
          </button>
          <button
            id="how-points-work-btn"
            onClick={handlePointsClick}
            className="text-white hover:text-amber-300 text-xs sm:text-sm font-semibold transition-colors cursor-pointer px-2 py-1"
          >
            {settings?.memberClubHowPointsWork || tMemberClub('howPointsWork')}
          </button>
        </div>
      </div>
    </section>
  );
};
