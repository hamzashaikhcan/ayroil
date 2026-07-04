/**
 * Answer-style pages for search and AI answer engines. Each page answers ONE
 * clear question in a format an LLM can quote: the question as the H1, a
 * direct answer up top, short supporting sections, and an FAQ block mirrored
 * into FAQPage structured data.
 *
 * Claim rules apply (Ayroil is a cosmetic hair oil, not a medicine): say
 * "supports scalp comfort", "for dandruff-prone routines", "helps with
 * dryness"; never "cures", "treats", "regrows", or "stops hair fall".
 */

export type AnswerSection = {
  heading: string;
  paragraphs?: string[];
  list?: string[];
};

export type AnswerPage = {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  question: string;
  /** The direct, quotable answer shown right under the H1. */
  answer: string;
  sections: AnswerSection[];
  faqs: { q: string; a: string }[];
};

export const ANSWER_PAGES: AnswerPage[] = [
  {
    slug: "best-hair-oil-for-dandruff-prone-scalp-pakistan",
    metaTitle: "Best Hair Oil for a Dandruff-Prone Scalp in Pakistan",
    metaDescription:
      "What to look for in a hair oil when your scalp is dandruff-prone: lightweight scalp-first formulas, purposeful ingredients, and honest routines that work in Pakistan.",
    question: "Which hair oil is best for a dandruff-prone scalp in Pakistan?",
    answer:
      "For a dandruff-prone scalp, choose a lightweight, scalp-first oil built on ingredients traditionally used for scalp care, such as rosemary, black seed, amla, and reetha, and use it consistently 2 to 3 times a week. Ayroil is a doctor-guided cosmetic hair oil made in Pakistan for exactly these routines: it supports scalp comfort and nourishment. It is not a medicine and does not treat fungal infection, severe dandruff, or scalp disease.",
    sections: [
      {
        heading: "What to look for",
        paragraphs: [
          "Most oils sold for dandruff concerns compete on loud promises. A more reliable filter is the formula and the routine it supports. Look for:",
        ],
        list: [
          "A scalp-first formula meant to be massaged into the scalp, not just coated on lengths",
          "A lightweight, non-greasy texture you will actually use twice a week",
          "Ingredients traditionally used for scalp care: rosemary, black seed, amla, reetha, shikakai",
          "Honest wording: 'supports' and 'helps', never 'cures' or 'guaranteed'",
          "A clear how-to-use routine on the label or product page",
        ],
      },
      {
        heading: "Why scalp-first matters for dandruff-prone hair",
        paragraphs: [
          "Flaking and itching concerns start at the scalp, yet many oils focus on shine and length. A dandruff-prone routine benefits from the opposite: small amounts applied directly to the scalp, a gentle 3 to 5 minute massage, and a consistent weekly rhythm. The goal is a scalp that feels clean, comfortable, and cared for, which gives hair a better foundation.",
        ],
      },
      {
        heading: "How Ayroil fits this routine",
        paragraphs: [
          "Ayroil was formulated under the guidance of Dr. Maria around a single idea: scalp first, hair follows. Its blend combines rosemary, black seed, amla, reetha, and shikakai with argan, sweet almond, castor, vitamin E, and hyaluronic acid, each chosen for a purpose, from traditional scalp care to softness and shine. Used 2 to 3 times a week, it supports scalp comfort for dandruff-prone routines without a heavy, greasy feel.",
        ],
      },
      {
        heading: "When to see a dermatologist",
        paragraphs: [
          "A cosmetic oil supports a routine; it does not replace medical care. For persistent itching, heavy flaking, redness, broken skin, or suspected infection, consult a dermatologist. Ayroil is a cosmetic hair oil and is not a treatment for any scalp condition.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is Ayroil good for dandruff-prone scalp routines?",
        a: "Ayroil is a cosmetic hair oil designed for scalp comfort, dryness, flake-prone routines, and hair nourishment. Used consistently 2 to 3 times a week with a gentle scalp massage, it supports a cleaner, calmer scalp routine. It is not a medicine and does not treat fungal infection, severe dandruff, or scalp disease.",
      },
      {
        q: "Can Ayroil cure dandruff or fungal infection?",
        a: "No. Ayroil is a cosmetic hair oil, not a medical treatment. It supports care for a dandruff-prone scalp, but persistent flaking, itching, or suspected infection should be checked by a dermatologist.",
      },
      {
        q: "How often should I oil a dandruff-prone scalp?",
        a: "A consistent rhythm of 2 to 3 times a week works well for most routines. Apply a small amount directly to the scalp, massage gently for 3 to 5 minutes, leave it in for a few hours or overnight, then wash as usual.",
      },
      {
        q: "Where can I buy Ayroil in Pakistan?",
        a: "Ayroil is sold online at ayroil.com with delivery across Pakistan in 3 to 4 days and free delivery on every order. A 7-day return window applies from delivery.",
      },
    ],
  },
  {
    slug: "hair-oil-for-dry-scalp",
    metaTitle: "Hair Oil for Dry Scalp: What Works and Why",
    metaDescription:
      "Why scalps get dry, which oil ingredients help with dryness, and a simple weekly oiling routine that supports scalp comfort and softer, healthier-looking hair.",
    question: "What is a good hair oil for a dry scalp?",
    answer:
      "A good dry-scalp oil is lightweight, non-greasy, and built around nourishing ingredients such as sweet almond oil, vitamin E, black seed oil, and hyaluronic acid for scalp hydration support. Applied to the scalp 2 to 3 times a week with a gentle massage, it helps a dry, tight-feeling scalp feel comfortable and supports softer, healthier-looking hair. Ayroil combines these ingredients in one scalp-first blend.",
    sections: [
      {
        heading: "Why scalps get dry",
        paragraphs: [
          "Hot water, harsh shampoos, styling heat, sun, and dry weather all strip moisture from the scalp. A dry scalp can feel tight and itchy, look flaky, and leave hair looking dull. Treating only the lengths with serums or conditioners skips the place the problem starts.",
        ],
      },
      {
        heading: "Ingredients that help with dryness",
        list: [
          "Sweet almond oil: softness, nourishment, and dry hair care",
          "Vitamin E: nourishment and protection from dryness",
          "Hyaluronic acid: scalp hydration support",
          "Black seed oil: deep nourishment, known in traditional scalp care",
          "Argan oil: smoother, shinier, healthier-looking lengths",
        ],
      },
      {
        heading: "A simple weekly routine",
        paragraphs: [
          "Two or three evenings a week, part your hair and apply a small amount of oil directly to the scalp. Massage gently for 3 to 5 minutes, leave it in for a few hours or overnight, then wash as usual. Consistency matters more than quantity: a small amount applied regularly beats a heavy soak once a month.",
        ],
      },
      {
        heading: "What to expect",
        paragraphs: [
          "In the first weeks of consistent use, most people notice the scalp feeling more comfortable and hair feeling softer. Over the following weeks, hair tends to look and feel healthier. Results vary from person to person, and a cosmetic oil is not a treatment for any skin condition; see a dermatologist for persistent irritation.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is a dry scalp the same as dandruff?",
        a: "Not exactly. A dry scalp is a moisture issue that can cause small, dry flakes and tightness, while dandruff concerns can have other causes. A nourishing scalp oil supports comfort in both routines, but persistent or heavy flaking should be checked by a dermatologist.",
      },
      {
        q: "Can men and women both use Ayroil?",
        a: "Yes. Ayroil is made for men and women dealing with dry scalp, dandruff-prone hair, weak roots, hair fall concerns, or dull hair. The routine is the same: a small amount on the scalp, 2 to 3 times a week.",
      },
      {
        q: "Will hair oil make my hair greasy?",
        a: "A lightweight formula used in small amounts should not. Ayroil is designed to be non-greasy: apply a little directly to the scalp rather than soaking the lengths, and wash as usual afterwards.",
      },
      {
        q: "How long until a dry scalp feels better?",
        a: "Most routines take a few weeks of consistent use before the difference is clear. Use the oil 2 to 3 times a week and judge results over a month or two, not overnight. Individual results vary.",
      },
    ],
  },
  {
    slug: "how-to-use-ayroil-hair-oil",
    metaTitle: "How to Use Ayroil Hair Oil: Routine, Steps and Tips",
    metaDescription:
      "The exact Ayroil routine: how much oil to use, how to massage it into the scalp, how long to leave it in, how often to repeat it each week, and mistakes to avoid.",
    question: "How do you use Ayroil hair oil?",
    answer:
      "Apply a small amount of Ayroil directly to the scalp, part your hair and distribute the oil across the scalp where needed, then massage gently for 3 to 5 minutes. Leave it in for a few hours or overnight, then wash as usual. Repeat 2 to 3 times a week. Consistency over weeks is what makes the difference.",
    sections: [
      {
        heading: "Step by step",
        list: [
          "Part your hair into sections so the scalp is easy to reach",
          "Apply a small amount of oil directly to the scalp, section by section",
          "Massage gently with fingertips for 3 to 5 minutes",
          "Leave the oil in for a few hours, or overnight if you prefer",
          "Wash your hair as usual",
          "Repeat 2 to 3 times a week",
        ],
      },
      {
        heading: "How much oil to use",
        paragraphs: [
          "Less than you think. The goal is a lightly coated scalp, not dripping hair. A small amount worked in with a good massage does more than a heavy pour, and it washes out easily so the routine stays pleasant enough to repeat.",
        ],
      },
      {
        heading: "Tips for best results",
        paragraphs: [
          "The massage matters as much as the oil: it distributes the blend and gives the scalp a few minutes of dedicated care. Oil in the evening so it can sit for hours without getting in the way. A patch test before first use is recommended, especially for sensitive skin.",
        ],
      },
      {
        heading: "Mistakes to avoid",
        list: [
          "Oiling only the lengths and skipping the scalp",
          "Using too much oil, then giving up because washing it out is a chore",
          "Expecting overnight results; judge the routine after weeks, not days",
          "Continuing use if irritation occurs; stop and consult a dermatologist",
        ],
      },
    ],
    faqs: [
      {
        q: "Can I leave Ayroil in overnight?",
        a: "Yes. Leaving the oil in overnight is a common way to use it. Apply a small amount to the scalp in the evening, massage gently, and wash your hair as usual in the morning.",
      },
      {
        q: "How many times a week should I use Ayroil?",
        a: "Use it 2 to 3 times a week. A steady weekly rhythm matters more than heavy occasional use, and results build gradually over weeks of consistency.",
      },
      {
        q: "Do I apply Ayroil to wet or dry hair?",
        a: "Apply it to dry or nearly dry hair, directly on the scalp. That keeps the oil where it works and makes the 3 to 5 minute massage more effective.",
      },
      {
        q: "When will I see results?",
        a: "Most people notice the scalp feeling more comfortable and hair feeling softer within the first weeks. Healthier-looking hair builds over a month or two of consistent use. Results vary from person to person.",
      },
    ],
  },
  {
    slug: "ayroil-ingredients",
    metaTitle: "Ayroil Ingredients: All 10 Oils and What They Do",
    metaDescription:
      "The full Ayroil ingredient list: rosemary, black seed, amla, sweet almond, argan, vitamin E, reetha, shikakai, hyaluronic acid, and castor oil, with each one's role.",
    question: "What are the ingredients in Ayroil hair oil?",
    answer:
      "Ayroil contains ten purposeful ingredients: rosemary oil, black seed oil, amla, sweet almond oil, argan oil, vitamin E, reetha, shikakai, hyaluronic acid, and castor oil. Each has a defined role, from traditional scalp care to softness, shine, and scalp hydration support. Ayroil is a cosmetic blend formulated under the guidance of Dr. Maria; no ingredient is claimed to cure any condition.",
    sections: [
      {
        heading: "The full ingredient list and each one's role",
        list: [
          "Rosemary oil: traditionally used for scalp care and stronger-looking hair support",
          "Black seed oil: nourishment and traditional scalp care",
          "Amla: hair strength, shine, and traditional hair care",
          "Sweet almond oil: softness, nourishment, and dry hair care",
          "Argan oil: smoother, shinier, healthier-looking hair",
          "Vitamin E: nourishment and protection from dryness",
          "Reetha: gentle, time-tested Ayurvedic cleansing care",
          "Shikakai: traditional Ayurvedic strengthening care",
          "Hyaluronic acid: scalp hydration support",
          "Castor oil: traditional root and thickness care",
        ],
      },
      {
        heading: "Why a purposeful blend instead of one hero oil",
        paragraphs: [
          "Single-oil products do one job. A scalp-first routine asks for several: scalp comfort, dryness care, root support, and a finish that is soft and shiny rather than greasy. Ayroil combines Ayurvedic classics like amla, reetha, and shikakai with rosemary, argan, and modern additions like hyaluronic acid so one bottle covers the whole routine.",
        ],
      },
      {
        heading: "Safety and honest limits",
        paragraphs: [
          "Ayroil is a cosmetic hair oil for external use only. Do a patch test before first use, avoid contact with eyes, and stop use if irritation occurs. No ingredient in Ayroil cures dandruff, fungal infection, or hair loss; for persistent scalp concerns, consult a dermatologist.",
        ],
      },
    ],
    faqs: [
      {
        q: "Are Ayroil's ingredients natural?",
        a: "Ayroil is built on natural oils and botanicals: rosemary, black seed, amla, sweet almond, argan, reetha, shikakai, and castor oil, alongside vitamin E and hyaluronic acid for nourishment and scalp hydration support. Every ingredient is chosen for a specific role in the blend.",
      },
      {
        q: "Which Ayroil ingredients are best for dandruff-prone routines?",
        a: "Rosemary, black seed, reetha, and shikakai are the ingredients traditionally associated with scalp care in the blend. Together with a consistent 2 to 3 times a week massage routine, they support scalp comfort for dandruff-prone hair.",
      },
      {
        q: "Can I use Ayroil on a sensitive scalp?",
        a: "Do a small patch test before first use, which is good practice for any new product on sensitive skin. If you experience redness, itching, or discomfort, stop using the product and consult a dermatologist.",
      },
      {
        q: "Does any ingredient in Ayroil cure dandruff or hair loss?",
        a: "No. Ayroil is a cosmetic hair oil and makes no medical claims. Its ingredients support scalp nourishment, dryness care, and healthier-looking hair with regular use; they do not treat or cure any condition.",
      },
    ],
  },
  {
    slug: "argan-oil-black-seed-oil-rosemary-oil-benefits",
    metaTitle: "Argan, Black Seed and Rosemary Oil Benefits for Hair",
    metaDescription:
      "What argan oil, black seed oil, and rosemary oil are each traditionally known for in hair care, and why combining them in one scalp-first blend works well.",
    question: "What are the benefits of argan oil, black seed oil, and rosemary oil for hair?",
    answer:
      "Rosemary oil is traditionally used for scalp care and stronger-looking hair. Black seed oil is known in traditional scalp care for deep nourishment. Argan oil is known for smoother, shinier, healthier-looking lengths. Each covers a different part of hair care, which is why Ayroil blends all three with seven more purposeful ingredients in one scalp-first oil.",
    sections: [
      {
        heading: "Rosemary oil",
        paragraphs: [
          "Rosemary is one of the most popular ingredients in modern hair care, traditionally used for scalp care and stronger-looking hair support. It suits routines built around scalp massage, where the oil is worked into the scalp rather than coated on lengths.",
        ],
      },
      {
        heading: "Black seed oil",
        paragraphs: [
          "Black seed (kalonji) has a long history in traditional scalp care across South Asia and the Middle East. In a hair blend, its role is deep nourishment for the scalp, supporting comfort in dry and flake-prone routines.",
        ],
      },
      {
        heading: "Argan oil",
        paragraphs: [
          "Argan is the finishing ingredient: known for smoother, shinier, healthier-looking hair. It helps dull, dry lengths look revived without the heavy feel of thicker oils.",
        ],
      },
      {
        heading: "Why they work better together",
        paragraphs: [
          "One oil cares for the scalp, one nourishes deeply, one finishes the lengths. Used alone, each leaves a gap. Ayroil combines rosemary, black seed, and argan with amla, reetha, shikakai, sweet almond, castor, vitamin E, and hyaluronic acid, so a single 2 to 3 times a week routine covers scalp comfort, dryness care, root support, and shine. No oil, alone or blended, cures scalp conditions; consult a dermatologist for persistent concerns.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is rosemary oil alone enough for hair care?",
        a: "Rosemary covers the scalp-care side of a routine, but it does little for dry lengths or shine. A blend that adds nourishing and finishing oils, like black seed, almond, and argan, covers the full routine in one step.",
      },
      {
        q: "Can I use these oils every day?",
        a: "Daily oiling is unnecessary for most routines and makes washing a chore. A consistent 2 to 3 times a week rhythm, with a 3 to 5 minute scalp massage, is easier to maintain and is how Ayroil is designed to be used.",
      },
      {
        q: "Which of these oils is best for a dry scalp?",
        a: "Black seed oil is the strongest fit for dry-scalp nourishment among the three, and it works even better alongside sweet almond oil, vitamin E, and hyaluronic acid, which support softness and scalp hydration. All of these are in the Ayroil blend.",
      },
      {
        q: "Do these oils regrow hair?",
        a: "No oil can honestly promise regrowth. These ingredients are traditionally used to support scalp care and stronger-looking hair with regular use, and results vary from person to person. Be cautious of any product claiming guaranteed growth.",
      },
    ],
  },
  {
    slug: "doctor-guided-hair-oil-pakistan",
    metaTitle: "Doctor-Guided Hair Oil in Pakistan: What It Means",
    metaDescription:
      "What 'doctor-guided' means for a cosmetic hair oil like Ayroil, what it does not mean, and why guidance matters in a market full of miracle hair claims.",
    question: "What does a doctor-guided hair oil mean?",
    answer:
      "A doctor-guided hair oil is a cosmetic product whose formulation and routine were shaped under a doctor's guidance. For Ayroil, that is Dr. Maria, whose input guided the choice of purposeful ingredients and the scalp-first routine. Doctor-guided does not mean the product is a medicine, a prescription, or a treatment for any scalp condition.",
    sections: [
      {
        heading: "What doctor-guided means, and what it does not",
        paragraphs: [
          "Guided means the formula was put together with professional input instead of guesswork: which ingredients earn a place, in what kind of blend, and what routine makes them useful. It does not mean medically approved, clinically proven, or capable of treating disease. Ayroil never claims to cure dandruff, fungal infection, or hair loss.",
        ],
      },
      {
        heading: "Why guidance matters in this market",
        paragraphs: [
          "Hair oil shelves in Pakistan are crowded with miracle promises: guaranteed growth, permanent hair fall control, overnight results. Guidance pulls a brand the other way, toward realistic routines, honest wording, and ingredients with a defined purpose. That is why Ayroil talks about supporting scalp comfort and stronger-looking hair with consistent use, and tells customers with persistent concerns to see a dermatologist.",
        ],
      },
      {
        heading: "The Ayroil approach",
        paragraphs: [
          "Ayroil is built on one idea: scalp first, hair follows. The blend of ten purposeful ingredients, from rosemary and black seed to amla, reetha, and shikakai, targets the scalp, and the routine is simple: a small amount massaged in 2 to 3 times a week, left in for a few hours or overnight. Formulated under the guidance of Dr. Maria, sold as what it honestly is: a cosmetic hair oil.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is Ayroil a medicine or a doctor-approved treatment?",
        a: "No. Ayroil is a doctor-guided cosmetic hair oil, not a medicine or a medical treatment. It supports scalp nourishment and healthier-looking hair with regular use, and it makes no treatment claims for dandruff, infection, or hair loss.",
      },
      {
        q: "Do I need a prescription to buy Ayroil?",
        a: "No. Ayroil is a cosmetic product available to everyone, sold online at ayroil.com with delivery across Pakistan. No prescription or consultation is required.",
      },
      {
        q: "Who should not rely on a cosmetic hair oil?",
        a: "Anyone with persistent itching, heavy flaking, redness, broken skin, suspected infection, or severe hair fall should see a dermatologist. A cosmetic oil supports a care routine; it does not diagnose or treat conditions.",
      },
      {
        q: "Can men and women both use a doctor-guided hair oil?",
        a: "Yes. Ayroil is made for men and women dealing with dry scalp, dandruff-prone hair, weak roots, hair fall concerns, or dull hair, with the same simple routine for everyone.",
      },
    ],
  },
];

export function getAnswerPage(slug: string): AnswerPage | undefined {
  return ANSWER_PAGES.find((p) => p.slug === slug);
}
