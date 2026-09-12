export const AGE_RANGES = ["18-29", "30-39", "40-49", "50+"] as const;

export type AgeRange = (typeof AGE_RANGES)[number];

export type AgeCardConfig = {
  ageRange: AgeRange;
  label: string;
  imageUrl: string;
  imageAlt: string;
};

export type LegalLink = {
  label: string;
  href: string;
};

export type DocsLink = LegalLink;

export type PilatesConfig = {
  flow: string;
  page: {
    id: number;
    type: "generated";
    title: string;
    variant: "four_cards";
  };
  brand: {
    logoUrl: string;
    logoAlt: string;
  };
  heading: {
    line1: string;
    line2: string;
    prompt: string;
  };
  cards: AgeCardConfig[];
  legal: {
    prefix: string;
    terms: LegalLink;
    separator: string;
    privacy: LegalLink;
    reviewText: string;
  };
  docs: {
    title: string;
    links: DocsLink[];
    supportEmail: string;
  };
};

export const PILATES_CONFIG: PilatesConfig = {
  flow: "2117",
  page: {
    id: 6893,
    type: "generated",
    title: "First Page Type",
    variant: "four_cards",
  },
  brand: {
    logoUrl:
      "https://image-service.betterme.world/57355568-8766-44a5-a327-6266bc0080f7/image/upload/c_fill%2Cw_256/f_webp/q_auto:eco/fl_lossy/c_fit/vlzgadxfpkojbod5mcro",
    logoAlt: "BetterMe",
  },
  heading: {
    line1: "HOME PILATES",
    line2: "WORKOUT STUDIO",
    prompt: "CHOOSE YOUR AGE",
  },
  cards: [
    {
      ageRange: "18-29",
      label: "Age: 18-29",
      imageUrl:
        "https://image-service.betterme.world/57355568-8766-44a5-a327-6266bc0080f7/image/upload/c_fill%2Cw_384/f_webp/q_auto:eco/fl_lossy/c_fit/c8wxnurtztbeoak4q5py",
      imageAlt: "Person representing the 18 to 29 age range",
    },
    {
      ageRange: "30-39",
      label: "Age: 30-39",
      imageUrl:
        "https://image-service.betterme.world/57355568-8766-44a5-a327-6266bc0080f7/image/upload/c_fill%2Cw_384/f_webp/q_auto:eco/fl_lossy/c_fit/qhibewotvetgnb4wblj6",
      imageAlt: "Person representing the 30 to 39 age range",
    },
    {
      ageRange: "40-49",
      label: "Age: 40-49",
      imageUrl:
        "https://image-service.betterme.world/57355568-8766-44a5-a327-6266bc0080f7/image/upload/c_fill%2Cw_384/f_webp/q_auto:eco/fl_lossy/c_fit/u5yhj6luzbri8mktij0b",
      imageAlt: "Person representing the 40 to 49 age range",
    },
    {
      ageRange: "50+",
      label: "Age: 50+",
      imageUrl:
        "https://image-service.betterme.world/57355568-8766-44a5-a327-6266bc0080f7/image/upload/c_fill%2Cw_384/f_webp/q_auto:eco/fl_lossy/c_fit/szbdyzw4pxukc0psxsh8",
      imageAlt: "Person representing the 50 and over age range",
    },
  ],
  legal: {
    prefix: "By choosing your age and continuing you agree to our",
    terms: {
      label: "Terms of Service",
      href: "https://betterme-pilates.com/en/legal/terms",
    },
    separator: "|",
    privacy: {
      label: "Privacy Policy",
      href: "https://betterme-pilates.com/en/legal/privacy-policy",
    },
    reviewText: "Please review before continuing",
  },
  docs: {
    title: "Docs",
    links: [
      {
        label: "FAQ",
        href: "https://betterme-pilates.com/legal/faq?flow=2117",
      },
      {
        label: "Terms and Conditions of use",
        href: "https://betterme-pilates.com/legal/terms?flow=2117",
      },
      {
        label: "Privacy Policy",
        href: "https://betterme-pilates.com/legal/privacy-policy?flow=2117",
      },
      {
        label: "Subscription Policy",
        href: "https://betterme-pilates.com/legal/subscription-policy?flow=2117",
      },
      {
        label: "Money-Back Policy",
        href: "https://betterme-pilates.com/legal/money-back-policy?flow=2117",
      },
      {
        label: "e-Privacy Settings",
        href: "https://betterme.world/en/eprivacy-settings",
      },
    ],
    supportEmail: "support@betterme.world",
  },
};
