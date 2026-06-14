// My World — single source of truth for the globe view.
//
// Everything the globe needs lives here: the two selectable regions, the
// clickable locations inside each region, their coordinates, and the copy
// shown in the side panel. Add or edit a location by editing one entry in
// WORLD_LOCATIONS. Nothing else needs to change.

export type RegionId = "america" | "world";

export type WorldRegion = {
  id: RegionId;
  // Label shown on the region marker during step 1 (pick a region).
  label: string;
  // Short hint shown once this region is engaged (step 2).
  hint: string;
  // Marker position + where the globe rotates to when the region is picked.
  lat: number;
  lng: number;
  // Camera altitude (zoom) when this region becomes the focus. Bigger = farther.
  focusAltitude: number;
  // GeoJSON ADMIN names that belong to this region. Used to brighten the
  // matching landmasses once the region is selected.
  countries: string[];
};

// Which geographic shape to light up for this location.
//   source "states"    -> matched against the US states dataset by name
//   source "countries" -> matched against the world countries dataset (ADMIN)
export type LocationHighlight = {
  source: "states" | "countries";
  name: string;
};

export type WorldLocation = {
  slug: string;
  region: RegionId;
  // Marker label + panel fallback.
  label: string;
  // Where the name label sits and where the camera frames on select.
  lat: number;
  lng: number;
  // The shape that glows / is clickable for this location.
  highlight: LocationHighlight;
  // Panel body, one string per paragraph. The panel heading is `label`, so
  // this is just the story text. Placeholder for now (see banner below).
  content: string[];
  // Optional photo shown in the panel, fades in on select.
  image?: string;
};

export const WORLD_REGIONS: WorldRegion[] = [
  {
    id: "america",
    label: "The States",
    hint: "Tap a place in the States.",
    lat: 39.5,
    lng: -98.35,
    focusAltitude: 1.6,
    countries: ["United States of America"],
  },
  {
    id: "world",
    label: "Around the World",
    hint: "Tap a place around the world.",
    // Sits over the Arabian Sea so it reads as the hub of the international
    // grouping (South Asia, Middle East, SE Asia, and a reach to Portugal).
    lat: 18,
    lng: 64,
    focusAltitude: 2.1,
    countries: [
      "Pakistan",
      "Indonesia",
      "Turkey",
      "Saudi Arabia",
      "Malaysia",
      "Portugal",
    ],
  },
];

/* =========================================================================
   LOCATION CONTENT — PLACEHOLDER COPY. SWAP THIS LATER.

   These are the places visited so far. Each location's `content` is an array
   of paragraphs shown in the side panel; the panel heading is the `label`
   (e.g. "Saudi Arabia"). The text is throwaway gibberish for now. To drop in
   the real story, find the entry by `slug` and replace its `content` array.
   That is the only place per location you need to touch.
   ========================================================================= */

export const WORLD_LOCATIONS: WorldLocation[] = [
  // ----- America region -------------------------------------------------
  {
    slug: "georgia",
    region: "america",
    label: "Georgia",
    lat: 33.749,
    lng: -84.388,
    highlight: { source: "states", name: "Georgia" },
    image: "/assets/sprites/georgia.jpg",
    content: [
      "I was born and raised right here in Georgia, and it's been an exciting time growing up through everything happening in Atlanta. I always lived out in the countryside where life moved slow and quiet, but as my college years went on that slowly changed, and I found myself spending more and more time in the city. That's where I like to be now, right in the middle of all the action.",
      "The people here are genuinely nice though, and the mountain views never get old. I always try to take solo trips around different parts of Georgia hoping to find more to it, but it kinda feels like every area is the same thing. This is also where I met so many of my friends, so it holds a lot for me. Honestly the place can be wicked at times, but just know it would make a dope GTA map.",
      "So come through and visit, but don't come here to stay, because Atlanta is full, bro, please.",
    ],
  },
  {
    slug: "tennessee",
    region: "america",
    label: "Tennessee",
    lat: 36.1627,
    lng: -86.7816,
    highlight: { source: "states", name: "Tennessee" },
    image: "/assets/sprites/tennessee.jpg",
    content: [
      "This is the best place for cowboys and all kinds of country stuff to get into. You got Gatlinburg and Pigeon Forge, which are a fun time to head around and explore, checking out cool parks and just seeing what's out there. Come through with your family for this one, it's that kind of place.",
      "Honestly I visit Tennessee a lot because my friend of over 7 years lives here, so I always swing by just because, why not. There's something about having a spot you can keep coming back to that makes it feel like a second home. He's planning to get married and I'm gonna be his best man, which is pretty awesome.",
      "I haven't been to Nashville or Memphis yet, and I'd kinda try to avoid them, though I'd maybe pull up to Nashville just for the In-N-Out, lol.",
    ],
  },
  {
    slug: "north-carolina",
    region: "america",
    label: "North Carolina",
    lat: 35.7796,
    lng: -78.6382,
    highlight: { source: "states", name: "North Carolina" },
    image: "/assets/sprites/northcarolina.jpg.webp",
    content: [
      "I've been here a couple times but only really around the Charlotte area, so I can't say I've seen all of it. Honestly it feels like a cleaner Atlanta than Atlanta itself, like a greener version with more mountains and woods to wander through. Everything just feels a little more open and easy to breathe in.",
      "I'd actually love to live there one day, mostly because it just looks healthier than living in Atlanta, lol. I'm heading back soon to catch the J. Cole concert at the Spectrum, so I'm pretty hype about that.",
      "And when you go, make sure you hit Carowinds, because you might get your ass fried for not riding the Fury. It's okay I was also too scared to ride it as well.",
    ],
  },
  {
    slug: "new-york",
    region: "america",
    label: "New York",
    lat: 40.7128,
    lng: -74.006,
    highlight: { source: "states", name: "New York" },
    image: "/assets/sprites/newyork.jpg",
    content: [
      "I've been coming here since I was a kid, which was always decent because my auntie lives out here, so I had a reason to keep coming back. I made a trip for New Year's too, since I'm the type to always watch the ball drop on TV and figured I'd finally see it for real. The food alone is worth the trip though, so dope, I'd come back just to eat my way through it again.",
      "The Statue of Liberty is always nice to catch even from far away, and it never really loses that feeling. One thing I gotta say is it smells exactly like downtown Atlanta, so it felt weirdly familiar the second I got there, lol. And I gotta say it, go Knicks, because that game was pretty insane ngl. I've got like 3 friends living here too, so every now and then we link up and hang out when I'm around.",
      "I might pull back up for Anime NYC, but maybe not. RIP NYC after that Knicks game though. :( ",
    ],
  },

  // ----- Around the World region ---------------------------------------
  {
    slug: "pakistan",
    region: "world",
    label: "Pakistan",
    lat: 33.6844,
    lng: 73.0479,
    highlight: { source: "countries", name: "Pakistan" },
    image: "/assets/sprites/pakistan.jpg",
    content: [
      "Pakistan is where my dad's side of the family is from, and going there honestly felt rushed because everything about it moved at a rush. There was sand everywhere and people riding motorcycles through all of it. I still remember pulling out of the airport in a van that had the goofiest horn ever, and man it was so annoying, lol.",
      "I came to visit my dad's family who haven't moved over to America yet, and they were so welcoming the whole time. Meeting them was a blessing, and I'd do anything for them, especially after the way they took care of us. And the food, bro, I lowkey gained like 20 pounds before I even left.",
      "I wouldn't go back by myself, but after my dad glazed about it for so long, it was such a nice time to finally see it for real. It was a lot of fun, and I'm glad I got to experience it.",
    ],
  },
  {
    slug: "indonesia",
    region: "world",
    label: "Indonesia",
    lat: -6.2088,
    lng: 106.8456,
    highlight: { source: "countries", name: "Indonesia" },
    image: "/assets/sprites/indonesia.webp",
    content: [
      "This is the area where my mother is from, and being here for a week really showed me the way she grew up. At first it looks like a utopia, but once you head outside the city of Jakarta it can honestly look a little scary. There's a lot that comes at your eyes here, but Jakarta itself felt like it carried a lot of Japanese influence, and you can feel that culture in everything, especially since most of it is pretty cheap.",
      "I still remember how long it took to get between the train stations, but it was so worth it because I was able to see where my grandma was. I just wish I'd had the chance to learn more about my mom's life growing up.",
      "I'm gonna come back to bring new hope to my mother's family, and my goal is to buy a house there one day for them to live in.",
    ],
  },
  {
    slug: "turkey",
    region: "world",
    label: "Turkey",
    // Centered on Istanbul; clicking the broader country area is fine.
    lat: 41.0082,
    lng: 28.9784,
    highlight: { source: "countries", name: "Turkey" },
    image: "/assets/sprites/turkey.jpg",
    content: [
      "Turkey is known for having one of the biggest international airports out there, and it's kind of insane how the whole area feels when you're in it. I gotta be honest though, every single time I visit it has that rainy mood to it, even after coming through like 4 times now. The Blue Mosque was still under construction while I was there, which was a little bummer.",
      "This is also the area where I first got to meet my mom's side of the family. I'd never met them before, but they had a chance to come through while traveling outside of Indonesia, so it all kind of lined up. It was still an incredible time, especially since we got to hop on a cruise and make our way out to Cat Island! :3 ",
    ],
  },
  {
    slug: "saudi-arabia",
    region: "world",
    label: "Saudi Arabia",
    lat: 24.7136,
    lng: 46.6753,
    highlight: { source: "countries", name: "Saudi Arabia" },
    image: "/assets/sprites/saudiarabia.jpg",
    content: [
      "Saudi Arabia is honestly the most beautiful place in the world to me, and the most holy too. Every single time I come here I find myself thinking I need to come back just to feel free again. Even though I always end up hungry whenever I'm here, that's just part of the journey, sitting in a car for 3 hours and then walking at least 10k plus steps after. It's an honest adventure, the kind that feels like it was made for us as humanity.",
      "The clock tower alone has like 73 floors to enter from, and it really felt like a way into heaven looking up at it. I still can't believe the architecture out here, it's got like 7 different hotels all built together, which I guess is just the culture but it's wild. I will say prepare for the heat though, because it's so hot with sand and wind breeze going everywhere, you can lowkey farm aura out there.",
      "I felt at peace here, and I'll always say that about going for umrah. I need to be there for hajj soon too, inshallah. I genuinely wish everyone in this world could experience this kind of greatness for themselves.",
    ],
  },
  {
    slug: "malaysia",
    region: "world",
    label: "Malaysia",
    lat: 3.139,
    lng: 101.6869,
    highlight: { source: "countries", name: "Malaysia" },
    image: "/assets/sprites/malaysia.png",
    content: [
      "I was only here for one day, but it honestly felt like I'd been there a year because of how much greatness came out of it. For one, the towers and buildings out here are beautiful, and the whole area of technology just felt right, like everything was built with intention. My dad's friend lived here too, and after so long the two of them finally reconnected, which was such a wholesome thing to witness.",
      "Walking around, it just gives you that feeling of the future, like you stepped into what's coming next. I don't even know why, but at one point I had to stop and take a selfie with one of the buildings because it was just that beautiful for the area.",
      "One day honestly wasn't enough though, so I definitely need to come back and stay way longer next time.",
    ],
  },
  {
    slug: "portugal",
    region: "world",
    label: "Portugal",
    lat: 38.7223,
    lng: -9.1393,
    highlight: { source: "countries", name: "Portugal" },
    image: "/assets/sprites/portugal.jpg",
    content: [
      "I came here on a solo trip to meet a friend I'd gotten pretty close with on Discord, and I figured why not just go out and actually meet her. It ended up being such an amazing time. I didn't get to see all of Portugal, but I feel like Porto pretty much summed up what the whole place is about.",
      "The beaches were a little insane, and from what I saw there were green mountains just outside the city. Going around just feels so European, like the peak of life where I could honestly stay forever. Riding the boats, walking from one area to the next, and their train system was pretty dope compared to New York, lol. There's always some festival going on with music keeping the city in good vibes.",
      "She made the whole trip unforgettable, and I'll never forget her, she holds a close tie to my heart that I will never let go of. I'd go back again fosho in a heartbeat. :) ",
    ],
  },
];

// Convenience lookups.
export const REGION_BY_ID: Record<RegionId, WorldRegion> = WORLD_REGIONS.reduce(
  (acc, r) => {
    acc[r.id] = r;
    return acc;
  },
  {} as Record<RegionId, WorldRegion>,
);

export function locationsForRegion(region: RegionId): WorldLocation[] {
  return WORLD_LOCATIONS.filter((l) => l.region === region);
}

export function locationBySlug(slug: string): WorldLocation | undefined {
  return WORLD_LOCATIONS.find((l) => l.slug === slug);
}

// ADMIN name -> region, so the globe can brighten a region's countries.
export const COUNTRY_REGION: Record<string, RegionId> = WORLD_REGIONS.reduce(
  (acc, r) => {
    r.countries.forEach((c) => {
      acc[c] = r.id;
    });
    return acc;
  },
  {} as Record<string, RegionId>,
);
