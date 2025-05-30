// SPDX-License-Identifier: GPL-3.0-or-later
/*
    Animal Rights Advocates Discord Bot
    Copyright (C) 2022, 2025  Anthony Berg, Euphemus1

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { ScheduledTask } from '@sapphire/plugin-scheduled-tasks';
import IDs from '#utils/ids';
import { getTextBasedChannel } from '#utils/fetcher';
import { isTextBasedChannel } from '@sapphire/discord.js-utilities';

export class DailyActivismMessageTask extends ScheduledTask {
  public constructor(
    context: ScheduledTask.LoaderContext,
    options: ScheduledTask.Options,
  ) {
    super(context, {
      ...options,
      pattern: '0 15 * * *', // Run every day at 15:00
    });
  }

  private messages: string[] = [
    '**Looking for tips to meet local vegans or activism events?**\n\n' +
      '🔹Try searching for vegan Facebook groups for your closet major city or area.\n' +
      '🔹Get in contact with an animal rights organization like ' +
      '[PETA](<https://www.peta.org/>), ' +
      '[Direct Action Everywhere](<https://www.directactioneverywhere.com/>), ' +
      '[Mercy for Animals](<https://mercyforanimals.org/>), ' +
      '[Humane Society of the US](<https://www.humanesociety.org/>), ' +
      '[Vegan Outreach](<https://veganoutreach.org/>), etc. in your area. ' +
      'Try searching for an organization promoting plant-based eating as well!\n' +
      '🔹You can also search in [Meetup](<https://www.meetup.com/home/>), ' +
      'a social media platform for organizing events and activities.\n' +
      '🔹Volunteering at animal sanctuaries.\n' +
      '🔹Start a Facebook or [Meetup](<https://www.meetup.com/home/>) group yourself!',

    '**Prefer a more non-confrontational form of activism?** Consider these ideas!\n\n' +
      '🔹Sidewalk chalking is a great way for public visual messaging in public areas ' +
      'with higher foot traffic. Chalking is not permanent and non-damaging so legally ' +
      "does not typically count as vandalism, so it's usually allowed but check with your local municipals first.\n" +
      '🔹You can also draw vegan messaging at the beach in the sand, weather permitting.\n' +
      '🔹Consider using vegan usernames like in online gaming or social media.\n' +
      '🔹Stickering such as placing them on your phone, car, laptop, or water bottle when going out.\n' +
      "🔹Wearing clothes that promote the vegan message whether you're just going out for groceries or at the gym to show off your cruelty-free gains to others.",

    '**Been to a nice vegan or vegan-friendly restaurant recently?**\n\n' +
      '🔹Write a Google or Yelp review with the keyword "vegan" about your experience and what foods you had.\n' +
      '🔹Share your opinion on the restaurant on Instagram or Facebook, ' +
      'bonus if you post in vegan/vegetarian Facebook groups.\n' +
      '🔹Sign up for the **[Happy Cow](<https://www.happycow.net/>)** 🐮 💜 app ' +
      'to list the restaurant and leave a review to help others easily access veg options too.',

    'Sign up for the **[Happy Cow](<https://www.happycow.net/>)** :cow: :purple_heart: app, ' +
      'a mobile app and website that lists vegan and vegan-friendly restaurants ' +
      'and also a passionate community of over one million vegan-focused members. ' +
      'Aside from listing restaurants it also lists farmers markets, health food stores ' +
      'and all types of businesses with a vegan focus.',

    '**Enjoyed a vegan product recently?**\n\n' +
      '🔹Share your opinion on the product on Instagram or Facebook, ' +
      'bonus if you post in vegan Facebook groups.\n' +
      '🔹Sign up on the **[abillion](<https://www.abillion.com/>)** app and write your review of the product. ' +
      'The platform allows users to review plant-based, cruelty-free and sustainable products, ' +
      'while donating between $0.10 and $1 to nonprofit organizations for each review written.',

    '**Tried out a great online recipe recently?** ' +
      'Be sure to leave a high rating and review to boost your favorite vegan and plant-based creator! :star:',

    '**Looking for street outreach opportunities?** ' +
      'Try searching for any local chapters from ' +
      '[Anonymous for the Voiceless](<https://www.anonymousforthevoiceless.org/>), ' +
      '[We The Free](<https://www.activism.wtf/>), or events in vegan ' +
      'Facebook/[Meetup](<https://www.meetup.com/home/>) groups.',

    '**Get political!** Join in local pressure campaigns and getting ballot measures passed ' +
      'with groups such as [Animal Activist Mentorship](<https://www.animalactivismmentorship.com/>), ' +
      '[PETA](<https://www.peta.org/action/campaigns/>), ' +
      '[Plant Based Treaty](<https://plantbasedtreaty.org/>), & ' +
      '[Pro-Animal Future](<https://proanimal.org/>) in the US, ' +
      '[Viva!](<https://viva.org.uk/>) in the UK, ' +
      '[Animal Justice Party](<https://www.animaljusticeparty.org/>) in AU. ' +
      'They can be coalitions with goals ranging from banning fur, banning foie gras, ' +
      'banning cages, getting plant-based milks in schools, to banning factory farms.',

    '**Be a foundation for local vegan community building.**\n\n' +
      '🔹There are numerous Facebook groups to assist new vegans and the veg curious ' +
      "in finding resources in their local community. If you don't have one, " +
      'consider starting one yourself!\n' +
      '🔹Direct people to **[r/Vegan](<https://www.reddit.com/r/vegan/>)** or ' +
      '**[r/AskVegans](<https://www.reddit.com/r/AskVegans/>)** on Reddit ' +
      'to ask questions or utilize the search function in the groups for specific advice.\n' +
      '🔹Schedule vegan potlucks, game nights, or other events on ' +
      '[Meetup](<https://www.meetup.com/home/>) for your area.',

    '**Harness your skills!** Utilize your unique skills and talent to be in service for the animals, such as:\n\n' +
      '🔹If you are a programmer or software engineer, consider volunteering with ' +
      '[Vegan Hacktivists](<https://veganhacktivists.org/>).\n' +
      '🔹If you are a graphic designer, you can help design pamphlets or T-shirts.\n' +
      '🔹If you are handy, consider volunteering at animal sanctuaries ' +
      'to help construct infrastructure for the residents.\n' +
      "🔹If you're a cook, consider taking photos and posting them in social media or foodie groups.\n" +
      '🔹If you got music or comedic talent, consider going to open mic events ' +
      'or volunteering at Veg Fests about veganism.',

    '**How can I become a better Outreacher?**\n\n' +
      '🔹Here is a useful **[video](<https://www.youtube.com/watch?v=-nznQXhXgMY>)** ' +
      'on a conversation structure guide by ' +
      "[The Victim's Perspective](<https://www.youtube.com/@TheVictimsPerspective>) on Youtube\n" +
      '🔹Learn from prominent vegan outreachers like ' +
      '[Earthling Ed](<https://www.youtube.com/@ed.winters>), ' +
      '[Joey Carbstrong](<https://www.youtube.com/@JoeyCarbstrong>), ' +
      '[Debug Your Brain](<https://www.youtube.com/@DebugYourBrain>), ' +
      '[Clif Grant](<https://www.youtube.com/@clifgrant>), ' +
      '[David Ramms](<https://www.youtube.com/@davidramms>), and more by watching their content.\n' +
      '🔹Do group outreach with ' +
      '[Anonymous for the Voiceless](<https://www.anonymousforthevoiceless.org/>), ' +
      '[We The Free](<https://www.activism.wtf/>), ' +
      '[Vegan Outreach](<https://veganoutreach.org/>), ' +
      'or host activism events in vegan Facebook/[Meetup](<https://www.meetup.com/home/>) groups.',

    '**Online comment section activism ideas:**\n\n' +
      '🔹Leaving comments on viral videos or posts on veganism or related videos ' +
      'that can direct toward veganism.\n' +
      "🔹Getting vegan allies involved to help give a 'like' to your comment or post to get noticed.\n" +
      '🔹Carnists giving you a short fuse? Consider keeping a digital document with saved ' +
      'pre-written replies to copy and paste to help avoid being tempted to use ' +
      'condescending tone in replies.',

    '**Willing to your get your hands dirty and be proactive for the animals?**\n\n' +
      '🔹Consider doing direct action, attending vigils such as by the ' +
      '[Animal Save Movement](<https://thesavemovement.org/>), or get involved in pressure campaigns.\n' +
      '🔹Get in contact with organizations such as ' +
      '[Direct Action Everywhere](<https://www.directactioneverywhere.com/>), ' +
      '[Animal Rebellion](<https://animalrebellion.org/about/>), ' +
      '[PETA](<https://www.peta.org/action/campaigns/>), and ' +
      '[Animal Liberation Front](<https://animalliberationfrontline.com/>)\n' +
      '🔹**[Video](<https://www.youtube.com/watch?v=LHyqJxSeUFc>)** on the importance of pressure campaigns ' +
      'by [The Cranky Vegan](<https://www.instagram.com/the.cranky.vegan>) on ' +
      '[VeganFTA](<https://veganfta.com/>).',

    '**In the US?** Get into legislation activism! Find state and local representatives ' +
      'to send letters about animal rights, meat subsidies, ag gag laws, environmental impacts, ' +
      'or increased food disease risks to by using ' +
      '[CommonCause.org](<https://www.commoncause.org/find-your-representative/>) ' +
      'by entering your street address.',

    '**In the US :flag_us:?** Get connected with ' +
      '[Agriculture Fairness Alliance](<https://www.agriculturefairnessalliance.org/>) ' +
      'for legislation activism! A 501(c)(4) nonprofit whose mission is to strategically ' +
      'employ lobbyists to accelerate policy changes that make sustainable plant-based food ' +
      'accessible to everyone at a price they can afford, empower communities to develop ' +
      'local plant based agriculture systems, and give farmers tools and strategy to transition ' +
      'from animal ag to plant based farming.',

    '**In Germany 🇩🇪?** Get connected with [V-Party3](<https://v-partei.de/>) for legislation activism!\n\n' +
      '> *Die V-Partei ist eine deutsche Partei, die der Tierproduktindustrie den Kampf angesagt hat, ' +
      'mit Verboten jeglicher tierischen Produkten, Tierversuchen und Zurschaustellung in Zoo und Circus. ' +
      'Zusätzlich setzen sie sich für ernstzunehmende ethische und ernährungstechnische Bildung an Schulen ' +
      'und den Schutz von Tierrechtsaktivisten ein und fördern bezahlbare Nahrungsmittel aus ' +
      'solidarischer Landwirtschaft mit ökologischen Alternativen zu Pestiziden.*',

    '**Need a cheatsheet for responding to justifications to harm and exploit animals?** ' +
      'Bookmark [Vegan Sidekick](<https://www.godfist.com/vegansidekick/guide.php>). ' +
      'A comprehensive list of the known excuses and the responses for them. ' +
      'It will also link to the common comebacks after responding to certain excuses too!',

    '**Looking for a streaming service of Plant-Based News & Entertainment Network for FREE?** ' +
      'Download [UnchainedTV](<https://unchainedtv.com/>) on your phone via the APP store ' +
      'or on your TV via your Amazon Fire Stick, AppleTV device or Roku device.',

    '**Need some food content creator recommendations?**\n\n' +
      '🔹[Nora Cooks](<https://www.noracooks.com/>) - Recipes that are easy to make and even easier to eat\n' +
      '🔹[Forks Over Knives](<https://www.forksoverknives.com/recipes/>) - Healthy whole food plant-based recipes\n' +
      '🔹[Rainbow Plant Life](<https://rainbowplantlife.com/>) - For the home cook looking to wow their friends\n' +
      '🔹[Cheap Lazy Vegan](<https://thecheaplazyvegan.com/blog/>) - Easy and affordable vegan meal ideas\n' +
      '🔹[The Foodie Takes Flight](<https://thefoodietakesflight.com/>) - Asian-inspired recipes\n' +
      '🔹[Vegan Richa](<https://www.veganricha.com/recipes/>) - Indian-inspired recipes\n' +
      '🔹[Eat Figs Not Pigs](<https://www.eatfigsnotpigs.com/>) - Fusion comfort foods\n' +
      '🔹[Thee Burger Dude](<https://theeburgerdude.com/>) - Popular fast food recipes veganized',

    '**Need a comprehensive source on vegan nutrition?** ' +
      '[Vegan Health](<https://veganhealth.org/>) is a website with sources and studies ' +
      'by registered dieticians on evidence-based nutrient recommendations.',

    '**Looking for activism opportunities and events near you?** ' +
      'Try [Animal Rights Calendar](<https://animalrightscalendar.com/>)! ' +
      'Not finding an organization or event? Contact email: *person@animalrightscalendar.com*',

    '📚 **Book Recommendation:** ' +
      '*The Joyful Vegan: How to Stay Vegan in a World That Wants You to Eat Meat, Dairy, and Egg* ' +
      'by Colleen Patrick-Goudreau\n\n' +
      '> In these pages, Colleen shares her wisdom for managing these challenges and arms readers—both vegan and ' +
      'plant-based—with solutions and strategies for "coming out vegan" to family, friends, and colleagues; ' +
      'cultivating healthy relationships (with vegans and non-vegans); communicating effectively; ' +
      'sharing enthusiasm without proselytizing; finding like-minded community; and experiencing peace of mind ' +
      'as a vegan in a non-vegan world.\n> \n' +
      '> By implementing the tools provided in this book, readers will find they can live ethically, ' +
      'eat healthfully, engage socially—and remain a joyful vegan.',

    '**Need a database of stock animal rights images and videos for activism?** ' +
      'Try [stock.weanimals.org](<https://stock.weanimals.org/>)',

    '📚 **Book Recommendation:** ' +
      "*Riding On the Power of Others: A Horsewoman's Path to Unconditional Love* " +
      'by Ren Hurst\n\n' +
      "> Ren Hurst's memoir explores her journey of self-discovery and healing through her relationships with horses, " +
      'learning to let go of control and embrace unconditional love and acceptance that leads her to walk away ' +
      'completely from riding and training horses and into a world where relationship is all that matters...\n> \n' +
      '> Through her experiences, Hurst reveals the transformative power of horses and the natural world to teach humans ' +
      'about empathy, compassion, and the interconnectedness of all beings.',

    '**Self-care as a Vegan Activist:**\n\n' +
      '🔹*Find a community* - Speaking to like-minded people will help to remind you that ' +
      'you most certainly are not alone - you are an important part of a growing movement for global change.\n' +
      '🔹*Take a break* - Make some time to do things you love, purely for your own enjoyment.\n' +
      '🔹*We are not gods* - You are not responsible for the whole world.\n' +
      '🔹*Celebrate small achievements* - All little wins add up to a make big difference.\n' +
      '🔹*Spend time with animals* - Farm animal sanctuaries often have open days where you can pay a visit ' +
      'to well-cared for ex-farm animals who are able to live in comfort and security.',

    '**Are you an experienced vegan who wants to help others adopt this compassionate lifestyle?**\n' +
      'Sign up as a mentor to be matched with a new vegan near you in the ' +
      '[Vegan Mentor Program](<https://veganoutreach.org/vegan-mentorship-program/>)! 🐣\n\n' +
      '> Recent research suggests many vegans backslide into eating animals and animal products. ' +
      'Vegan Outreach has set out to help prevent this through their Vegan Mentor Program.\n> \n' +
      '> New and aspiring vegetarians and vegans—and established vegans who are feeling alone in a world ' +
      'of meat eaters—are paired with vegan mentors who can provide guidance and support.',

    '**Sarina Farb** is a Midwest-based science educator, speaker, and vegan advocate who has been vegan ' +
      'since birth *(March 11, 1994)* https://www.instagram.com/bornvegan1/',

    '**Need assistance in finding a career to help the animal advocacy movement?**\n' +
      'Start here: <https://animaladvocacycareers.org/>\n\n' +
      '> Animal Advocacy Careers (AAC) helps advocates find and transition into meaningful opportunities ' +
      'that make the world better for animals. Alongside this, AAC closely monitors the skills and roles ' +
      'that are hardest to hire for, and areas outside nonprofits where mission-aligned candidates are most ' +
      'needed to accelerate change for animals. This enables us to guide and match candidates to roles where ' +
      'they can achieve the highest impact for animals and best align with their skills and career goals.',

    '**List of Medical Literature on Vegan Diets:**\n\n' +
      '[American Dietetics Association (Academy of Nutrition and Dietetics)](<https://pubmed.ncbi.nlm.nih.gov/19562864/>)\n' +
      '[National Health Service UK](<https://www.nhs.uk/live-well/eat-well/how-to-eat-a-balanced-diet/the-vegan-diet/>)\n' +
      '[British Nutrition Foundation](<https://www.nutrition.org.uk/putting-it-into-practice/plant-based-diets/healthy-eating-for-vegetarians-and-vegans/>)\n' +
      '[British Dietetics Association](<https://www.nutrition.org.uk/putting-it-into-practice/plant-based-diets/healthy-eating-for-vegetarians-and-vegans/>)\n' +
      '[Dietitians of Canada](<https://www.unlockfood.ca/en/Articles/Vegetarian-and-Vegan-Diets/What-You-Need-to-Know-About-Following-a-Vegan-Eati.aspx>)\n' +
      '[Heart and Stroke Foundation of Canada](<https://www.heartandstroke.ca/get-healthy/healthy-eating/specific-diets/for-vegetarians>)\n' +
      '[Dietitians Association of Australia](<https://dietitiansaustralia.org.au/diet-and-nutrition-health-advice>)\n' +
      '[World Health Organisation](<https://www.who.int/europe/publications/i/item/WHO-EURO-2021-4007-43766-61591>)\n' +
      '[Harvard Medical School](<https://www.health.harvard.edu/staying-healthy/becoming-a-vegetarian>)\n' +
      '[The Mayo Clinic](<https://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/in-depth/vegetarian-diet/art-20046446>)',
  ];

  public async run() {
    // Get the total messages sent in non-vegan general since last message
    const redisKey = 'dailyActivismMessageCounter';

    // const messageCount = await this.container.redis.get(redisKey);

    // Do not send if messages count is less than 100
    // if (!messageCount || +messageCount < 10) return;

    // Randomly select a message from the array
    const randomIndex = Math.floor(Math.random() * this.messages.length);
    const message = this.messages[randomIndex];

    const activism = await getTextBasedChannel(IDs.channels.activism.activism);

    if (!isTextBasedChannel(activism)) {
      this.container.logger.error(
        'Daily Activism: The bot could not find the activism channel!',
      );

      return;
    }

    await activism.send(message);

    // Reset the total message counter to 0
    await this.container.redis.set(redisKey, 0);
  }
}

declare module '@sapphire/plugin-scheduled-tasks' {
  interface ScheduledTasks {
    pattern: never;
  }
}
