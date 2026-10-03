export const oldSitesIntro =
  "I've had websites since I was a kid, starting on Geocities (unfortunately lost to the sands of time) and Expage. I never kept backups but the Wayback Machine kept some of them. Each screenshot is rebuilt from the archived HTML, with whatever images and iframes the archive still has.";

export interface Snapshot {
  date: string;
  title: string;
  archive: string;
  note?: string;
  quote?: string;
  source?: { label: string; code: string; lang?: "html" | "css" };
  image: { src: string; alt: string; width: number; height: number; caption: string };
}

export interface OldSite {
  domain: string;
  years: string;
  about: string;
  snapshots: Snapshot[];
}

export const oldSiteId = (domain: string) => domain.replace(/[./]/g, "-");

const wayback = (timestamp: string, url: string) =>
  `https://web.archive.org/web/${timestamp}/${url}`;

export const oldSites: OldSite[] = [
  {
    domain: "expage.com/harrypotterhype",
    years: "2002",
    about:
      "A Dutch Harry Potter fan site on Expage, a free homepage builder. It had a Sorting Hat, a Quidditch quiz and a weekly newsletter you could sign up for (aka Owl Mail)",
    snapshots: [
      {
        date: "2002-03-23",
        title: "Harry Potter",
        archive: wayback("20020914210838", "http://www.expage.com/harrypotterhype"),
        image: {
          src: "/old-sites/expage-harrypotterhype.png",
          alt: "A Times New Roman Expage page with a black witch's hat, white welcome text, a list of links with tiny hat bullets, a Mini Quiz icon, a flying bat and a counter at 705",
          width: 800,
          height: 2150,
          caption:
            "Rebuilt from Expage's own clip art. The wizard hat background tile wasn't saved so it's plain grey here.",
        },
        note: "A guestbook, a forum, a Mini Quiz, and a visitor counter at 705.",
        quote:
          "Heb je een opmerking of een vraag? Stuur dan een Uilmailtje naar Perkamentus. Deze site heeft niks te maken met Warner Bros.",
      },
      {
        date: "2003-11-05",
        title: "De Middagprofeet",
        archive: wayback("20031105005941", "http://www.expage.com/harrypotterhypedemiddagprofeet"),
        image: {
          src: "/old-sites/expage-middagprofeet.png",
          alt: "De Middagprofeet in big black serif type on a tiled orange spiderweb background",
          width: 800,
          height: 420,
          caption: "Complete, spiderweb and all.",
        },
        quote:
          "Je wil als Dreuzel natuurlijk wel weten wat er gebeurt in de tovenaarswereld. Stuur een uil-mailtje met je e-mail adres om wekelijks de Middagprofeet te ontvangen met het laatste nieuws over Harry Potter!",
      },
    ],
  },
  {
    domain: "foot-loose.org",
    years: "2003–2004",
    about:
      "My first domain, bought in May 2003, using my uncle's credit card (these were rare in the Netherlands at the time). I made a new layout every few weeks. This one is absolutely positioned on a 7pt Tahoma page (a11y was not a thing), with a Greymatter blog in an iframe. I hosted friends' sites on it too, and a collective called Discopunk. After I let the domain registry lapse, someone started using it to sell heated socks.",
    snapshots: [
      {
        date: "2003-10-02",
        title: "You're something beautiful (a contradiction)",
        archive: wayback("20031002100316", "http://www.foot-loose.org/"),
        source: {
          label: "In Internet Explorer, filter:chroma made one colour see-through.",
          code: `<iframe name="gm" width=204 height=220 style="filter:chroma(color=#10416E);" marginwidth = "0" marginheight = "0"
src="http://www.foot-loose.org/cgi-bin/?" frameborder=0></iframe>`,
        },
        image: {
          src: "/old-sites/foot-loose-20031002.png",
          alt: "A black page with a column of small blue blog posts in the middle, about needing a new layout and loving Doggy Fizzle Televizzle",
          width: 1024,
          height: 420,
          caption: "The header (muse.png) wasn't saved.",
        },
        note: "Black page, blue links, and the blog and sidebar in two see-through iframes.",
      },
      {
        date: "2003-10-10",
        title: "....!",
        archive: wayback("20031010124104", "http://www.foot-loose.org/"),
        source: {
          label: "Colored scrollbars which only Internet Explorer could parse. No Chrome in 2003!",
          lang: "css",
          code: `body
{
  scrollbar-face-color: #C1EBFF;
  scrollbar-highlight-color: #ffffff;
  scrollbar-3dlight-color: #000000;
  scrollbar-shadow-color: #000000;
  scrollbar-darkshadow-color: #C1EBFF;
  scrollbar-arrow-color: #000000;
  scrollbar-track-color: #C1EBFF;
}`,
        },
        image: {
          src: "/old-sites/foot-loose-20031010.png",
          alt: "A plain grey page with a few lines of black Tahoma text and blue links to egotripper.org/plastic and hosting",
          width: 1024,
          height: 420,
          caption: "There were no images.",
        },
        quote:
          'I do not like this site anymore. My "love" for it will probably come back, but till then I will be blogging here: egotripper.org/plastic.',
      },
      {
        date: "2003-10-22",
        title: "(W A V E103)",
        archive: wayback("20031022185346", "http://www.foot-loose.org/"),
        source: {
          label: "I used a fade script from Dynamic Drive, which survived!",
          code: `<script language="JavaScript1.2">

//Gradual-Highlight image script- By Dynamic Drive
//For full source code and more DHTML scripts, visit http://www.dynamicdrive.com
//This credit MUST stay intact for use
…
<img src="cbcam.png" border="0" style="filter:alpha(opacity=50);-moz-opacity:0.3" onMouseover="high(this)" onMouseout="low(this)">`,
        },
        image: {
          src: "/old-sites/foot-loose-20031022.png",
          alt: "A white page with a narrow dark blue blog box on the left, with red-highlighted comment links",
          width: 1024,
          height: 573,
          caption:
            "The WAVE103 header, background and webcam button weren't saved. The blog is the closest capture from 30 October.",
        },
        note: "This one had a webcam popup that faded in on hover, thanks to a Dynamic Drive script.",
      },
      {
        date: "2003-11-24",
        title: "with telephones they scream",
        archive: wayback("20031124001803", "http://www.foot-loose.org/"),
        source: {
          label:
            "The hosting application form, from August 2003. It POSTed to response-o-matic.com, which emailed it to the hidden address.",
          code: `<form action="http://response-o-matic.com/cgi-bin/rom.pl"
method="post" target="content">
<INPUT TYPE="hidden" NAME="your_email_address"
VALUE="whizkidvicious@hotmail.com">
…
<input name="desiredusername" value="desired username (foot-loose.org/~you)" size=50 style="background-color:transparent; color: #000000;
border: 1 #000000 solid">
…
<input name="howmanyspace" value="How many space do you need?" size=50 style="background-color:transparent; color: #000000;
border: 1 #000000 solid">
…
<input type="submit" value="host me!">`,
        },
        image: {
          src: "/old-sites/foot-loose-20031124.png",
          alt: "A grey page with a blog post on the far right about seeing Kill Bill, with red-highlighted links to friends",
          width: 1024,
          height: 457,
          caption:
            "The header and background weren't saved. The blog is the closest capture, from 3 December.",
        },
      },
      {
        date: "2003-12-12",
        title: "billyMARTIN",
        archive: wayback("20031212072024", "http://www.foot-loose.org/"),
        source: {
          label: "Three of the four links were popups.",
          code: `<!-- Image Map created by VisiMapperPro -->
<IMG SRC="billy.gif" USEMAP="#billy" BORDER=0>
<MAP NAME="billy" >
<!-- Image Map (Created by VisiMapperPro) billy starts... -->
<AREA SHAPE=RECT COORDS="308,374,346,386" href="http://www.foot-loose.org/content" onClick="crush=window.open('http://www.foot-loose.org/content','popup','toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=no,resizable=no,width=590,height=350');return false;">
…
<AREA SHAPE=RECT COORDS="389,413,342,425" HREF="http://www.foot-loose.org/discopunk" target="_blank" ALT="!@#collective;" >
<!-- End of Map Definition -->
</MAP>`,
        },
        image: {
          src: "/old-sites/foot-loose-20031212.png",
          alt: "A grey page with the Kill Bill blog post in the bottom left corner",
          width: 1024,
          height: 580,
          caption:
            "The Billy Martin image map and background weren't saved. The blog is the closest capture, from 3 December.",
        },
        note: "I loved image maps. I made them in VisiMapperPro Lite which I don't think is around anymore. Most links opened in popup windows.",
      },
      {
        date: "2003-12-26",
        title: "again i go unnoticed",
        archive: wayback("20031226013728", "http://www.foot-loose.org/"),
        source: {
          label: "The visitor counter with comments written as <!- … -!>.",
          code: `<!- Text counter Script, by Cut and Paste Scripts.  Hosted CGI, with NO adverts and FREE. http://www.cutandpastescripts.com -!>
<script language=JavaScript src="http://www.cutandpastescripts.com/cgi-bin/textcounter/textcounter2.pl?username=footloose&page=54395"></script>
<!- Copyright Cut and Paste Scripts -!>`,
        },
        image: {
          src: "/old-sites/foot-loose-20031226.jpg",
          alt: "A black page with Chris Carrabba upside down with a guitar, Dashboard Confessional lyrics, a narrow column of turquoise text with yellow links, and the blog on the left",
          width: 1024,
          height: 760,
          caption:
            "Only the header survived here, but the little heading images and background are unfortunately lost. The blog is the closest capture, from 3 December, and cropped: its iframe was 2,000 pixels tall (?? I don't know why I did this)",
        },
        quote:
          "Nienke. 14. Dutch. <3 Kevin Bacon. Christian Bale. Muse. Placebo. Orgy. Will&Grace. manga. Harry Potter. Stephen King. School=hell. … This is layout #who-knows, featuring that guy from Dashboard Confessional.",
      },
      {
        date: "2004-03-01",
        title: "coooocaine rodeo.",
        archive: wayback("20040301083215", "http://www.foot-loose.org/"),
        image: {
          src: "/old-sites/foot-loose-20040301.png",
          alt: "An empty grey page",
          width: 1024,
          height: 420,
          caption: "The page was only a 'I moved' button, and that wasn't saved.",
        },
        note: 'Just a "moved" button, pointing to suckerlove.org.',
      },
    ],
  },
  {
    domain: "suckerlove.org",
    years: "2004–2007",
    about:
      "A personal blog, named after a line in Placebo's Every You Every Me. It started in English with a Greymatter blog, and ended up in Dutch on WordPress. After I let the domain lapse it became a Japanese spam site.",
    snapshots: [
      {
        date: "2004-03-01",
        title: "I just like the things you do.",
        archive: wayback("20040301145531", "http://suckerlove.org/"),
        image: {
          src: "/old-sites/suckerlove-20040301.png",
          alt: "A light grey page with two dark grey Georgia blog posts in the bottom left and a Ravenclaw crest badge",
          width: 1024,
          height: 778,
          caption:
            "Another image map, it wasn't saved. The Ravenclaw badge still exists because it was hosted on nimbo.net.",
        },
        note: "",
      },
      {
        date: "2004-04-18",
        title: "hold your breath and count to ten",
        archive: wayback("20040418004508", "http://suckerlove.org/"),
        image: {
          src: "/old-sites/suckerlove-20040418.png",
          alt: "A white page with a short note in the bottom right corner",
          width: 1024,
          height: 423,
          caption: "The background and the fallapart.png header weren't saved.",
        },
      },
      {
        date: "2004-05-22",
        title: "Jou wanna waste my time? Okay.",
        archive: wayback("20040604093900", "http://suckerlove.org/"),
        source: {
          label: "The top of the sidebar.",
          code: `<table cellpadding="0" border="0" width="100%" align="center" bgcolor="transparent"
cellspacing="1" font color="class1" class="class1"><td bgcolor="transparent">»»» <b>REQUIREMENTS</b></tr></td></class></font></table>
PHP enabled browser (IE), 1024x768 screen resolution, Verdana, love for Tony Montana..or Al Pacino.
Or me. Whatever.`,
        },
        image: {
          src: "/old-sites/suckerlove-20040604.jpg",
          alt: "Three sepia photos of Al Pacino as Tony Montana above SUCKERLOVE.ORG, over a lime green blog with dark grey date bars and a sidebar with requirements, info, camness, the girl, navigation and loved",
          width: 1024,
          height: 1352,
          caption:
            "The header was archived as tony.gif rather than tony.png, so that's what's used here. The cam picture and link buttons are gone.",
        },
        quote:
          "new layout! i saw Scarface yesterday and I LOVED it, so I made a layout featuring Tony Montana… I need a host. lol. I have 3 euros.",
      },
      {
        date: "2004-06-12",
        title: "lolZ.",
        archive: wayback("20040612072523", "http://suckerlove.org/"),
        image: {
          src: "/old-sites/suckerlove-20040612.png",
          alt: "A white page with three lines of uppercase Arial Black text",
          width: 1024,
          height: 420,
          caption:
            "No images here. The Brandon that's being linked to in the image was my webhost. I believe he hosted my domain on cPanel, which was all the rage at the time.",
        },
        quote: "omg coming soon o_o I need to reinstall stuff (I changed hosts =D).",
      },
      {
        date: "2004-08-13",
        title: "suckerlove.org",
        archive: wayback("20040825195008", "http://suckerlove.org/"),
        image: {
          src: "/old-sites/suckerlove-20040825.png",
          alt: "A white page with teal Georgia blog posts and uppercase date headings, and a sidebar about Nienke, the site and friends",
          width: 1024,
          height: 1294,
          caption: "The Gladiator header and the little heading images weren't saved.",
        },
        note: "This layout featured Maximus from Gladiator. In the same month my computer crashed and I lost everything, and my online friend Daniël sent me Photoshop, Illustrator and Flash. I don't actually remember this but I guess I blogged about it.",
      },
      {
        date: "2004-09-17",
        title: "suckerlove.org",
        archive: wayback("20040922111947", "http://suckerlove.org/"),
        image: {
          src: "/old-sites/suckerlove-20040922.jpg",
          alt: "A halftone Christian Bale in pale blue watercolour above two columns of tiny pale blue text: blog posts on the left, welcome, about, navigation and cool people on the right",
          width: 1024,
          height: 1347,
          caption: "Complete. This layout was a single image.",
        },
        quote:
          "Yay new layout! Robert says I use that picture of Christian Bale way too much, but it's FCORE so it's ok ;)",
        note: "The first post on the new layout. I have no idea what FCORE means..?",
      },
      {
        date: "2004-10-23",
        title: "JALOUX; custom design&coding",
        archive: wayback("20041023043939", "http://jaloux.suckerlove.org/"),
        image: {
          src: "/old-sites/jaloux-20041023.png",
          alt: "A white page with two columns of teal text with pale blue highlighted headings: welcome, about us, pricing, special offer, navigation, contact",
          width: 1024,
          height: 938,
          caption: "The header and background weren't saved.",
        },
        note: "A tiny '''design studio''' (lol) on jaloux.suckerlove.org, run with Daniël from August 2004. Layouts, LiveJournal coding and MovableType installs, paid by PayPal. I don't think we ever made a single cent.",
        quote:
          "We try to keep our prices the lowest of the lowest, our services will have a maximum price of $1.25, including layouts, coding and customizing.",
      },
      {
        date: "2004-11-29",
        title: "I have to get into a bar. Everything fun in life happens in bars.",
        archive: wayback("20041129032818", "http://suckerlove.org/"),
        image: {
          src: "/old-sites/suckerlove-20041129.png",
          alt: "A blue-grey page with a white sidebar about Nienke and a long white column of blog posts",
          width: 1024,
          height: 1678,
          caption: "The header and background weren't saved.",
        },
        quote:
          "15, from Amsterdam, the Netherlands. 5'6\". Lazy. Unmotivated. Loves Head Automatica, Glassjaw, The Smiths, The Robot Ate Me, The Faint, The Killers, The Postal Service.",
        note: "I have NO idea what The Robot Ate Me is. A band? Also I had no idea I was actually listening to The Smiths in 2004 - if you'd asked me I'd tell you I didn't start listening to them until 2011 or so.",
      },
      {
        date: "2004-12-17",
        title: "see you at the bitter end.",
        archive: wayback("20041217054957", "http://suckerlove.org/"),
        image: {
          src: "/old-sites/suckerlove-20041217.png",
          alt: "A grey-blue page with a sidebar on the left and blog posts with pale blue uppercase date bars",
          width: 1024,
          height: 1250,
          caption: "The header and background weren't saved.",
        },
      },
      {
        date: "2005-01",
        title: "laugh until september",
        archive: wayback("20050115023305", "http://www.suckerlove.org/lost.jpg"),
        image: {
          src: "/old-sites/suckerlove-september.jpg",
          alt: "A teal, grungy collage of a singer in a trucker cap and a guitarist, with SUCKERLOVE.ORG in white along the bottom",
          width: 446,
          height: 331,
          caption: "Only the header image was saved, not the page around it.",
        },
      },
      {
        date: "2005-01-30",
        title: "what's new for the fall?",
        archive: wayback("20050130095854", "http://suckerlove.org/"),
        image: {
          src: "/old-sites/suckerlove-20050130.png",
          alt: "A white page with a small grey-green box saying new domain coming soon",
          width: 1024,
          height: 420,
          caption: "Complete. There were no images.",
        },
        quote: "New domain coming soon (I hope).",
      },
      {
        date: "2006-07-14",
        title: "Oh lovely summer, how I try to enjoy thee!",
        archive: wayback("20060716065212", "http://www.suckerlove.org/"),
        image: {
          src: "/old-sites/suckerlove-20060716.png",
          alt: "An unstyled WordPress page in Times New Roman with blue links, Dutch blog posts and a sidebar listing recently played Boards of Canada tracks",
          width: 1000,
          height: 1500,
          caption: "The theme's stylesheet wasn't saved, so this is the bare HTML. Cropped.",
        },
        note: "Back, on WordPress, and blogging in Dutch now.",
        quote:
          "Ik heb geen zin om te updaten/bloggen aangezien ik héél druk bezig ben met mijn LiveJournal layout, maar ik doe het toch maar want ik vind het zelf zo vervelend als mensen nooit hun site updaten.",
      },
      {
        date: "2007-01-03",
        title: "the drugs don't make me high, they make me neutral",
        archive: wayback("20070105205502", "http://www.suckerlove.org/"),
        image: {
          src: "/old-sites/suckerlove-20070105.jpg",
          alt: "A pink WordPress blog with a SUCKERLOVE logo, a post with a photo of a man in a powdered wig toasting, and a brown sidebar with recent posts, recently played tunes and books",
          width: 1000,
          height: 2358,
          caption:
            "Rebuilt with the theme's stylesheet and the Photobucket photo. The Flickr photos and most smilies are gone.",
        },
      },
    ],
  },
  {
    domain: "trigger-joy.net",
    years: "2004",
    about:
      "My online friend Justine gave me this domain for my icons and ~art~, while the blog stayed on suckerlove.org. It ran on b2 and had three layouts in two months, the last turning it into an LJ icon collective. By the end of September it said Coming up, and by December it was parked.",
    snapshots: [
      {
        date: "2004-07-30",
        title: "(unwind)",
        archive: wayback("20040730123003", "http://trigger-joy.net/"),
        image: {
          src: "/old-sites/trigger-joy-20040730.png",
          alt: "A mostly empty white page with a small column of blog posts at the bottom right under black bars with red text",
          width: 1024,
          height: 815,
          caption: "The header, background and stylesheet weren't saved.",
        },
        quote:
          "FINALLY! I opened this thing up ;D Everything is done, yay. There aren't many icons yet, but I'm still adding icons every time I can. Anyways, I hope you enjoy everything and don't forget to visit Justine since she gave me this domain =333",
      },
      {
        date: "2004-08-02",
        title: "(unwind)",
        archive: wayback("20040802093038", "http://trigger-joy.net/"),
        image: {
          src: "/old-sites/trigger-joy-20040802.png",
          alt: "A white page with two columns of small Arial text, a welcome and the blog on the left and a content box on the right",
          width: 1024,
          height: 425,
          caption: "The Thursday header and background weren't saved.",
        },
        note: "Navigation was the numbers 1 to 5 in the header.",
        quote:
          "New layout! I really like it =) It features Thursday, lalalala. I'm going to bed now, I'll put up more icons later.",
      },
      {
        date: "2004-08-29",
        title: "(unwind)",
        archive: wayback("20040829143014", "http://www.trigger-joy.net/"),
        image: {
          src: "/old-sites/trigger-joy-20040829.png",
          alt: "A white page with one short welcome paragraph in teal Georgia",
          width: 1024,
          height: 420,
          caption: "The header and background weren't saved.",
        },
        quote:
          "This is Nienke's lj icon collective. If you want to read my blog or see some visitor's content I suggest you go to suckerlove.org.",
      },
    ],
  },
  {
    domain: "stereofrequency.org/noise",
    years: "2004",
    about:
      "A photolog on my friend Robert's domain. It had three sets: The Dam, The Killers and Jansen.",
    snapshots: [
      {
        date: "2004-11-17",
        title: "NOISE !!",
        archive: wayback("20041117212353", "http://www.stereofrequency.org/noise/"),
        image: {
          src: "/old-sites/noise-20041117.jpg",
          alt: "A dark damask page with teal-tinted gig photos of a keyboardist and a guitarist, a Photolog heading and a Navigation box",
          width: 1024,
          height: 476,
          caption:
            "The header image is from a capture of the same file in March 2005. The background tile wasn't saved.",
        },
        quote:
          "Opened up /noise as my photolog. My personal site moved back to suckerlove.org because I suck :(",
      },
    ],
  },
  {
    domain: "hellomannequin.org",
    years: "2005",
    about:
      "My domain after suckerlove, registered on 18 April 2005 and named after a Joy Electric song. It was a portfolio and blog, hosted first by Gaby and later by Travis, and I hosted friends on it too. By early 2006 it was an empty cPanel page.",
    snapshots: [
      {
        date: "2005-04-27",
        title: "*HM.ORG coward, the next time you want to fuck me over stab me in the front",
        archive: wayback("20050429071342", "http://www.hellomannequin.org/"),
        image: {
          src: "/old-sites/hellomannequin-20050429.png",
          alt: "A dark grey page with grey blog posts on the left and a sidebar with about, girl, content, links and contact headings",
          width: 1024,
          height: 1005,
          caption: "The Atreyu header and background weren't saved.",
        },
        quote:
          "First blog on my new domain! It's hosted by Gaby, go give her lots of love <3 Anyhow, I have been out of this whole website thing for way too long and I need people to link!",
      },
      {
        date: "2005-08-26",
        title: "HELLOMANNEQUIN (when one eight becomes two zeros)",
        archive: wayback("20050827152834", "http://www.hellomannequin.org/"),
        image: {
          src: "/old-sites/hellomannequin-20050827.jpg",
          alt: "A light grey page with red serif headings, a sidebar, and a blog post with four photos of a customised pocket diary covered in gig posters",
          width: 1024,
          height: 2266,
          caption:
            "The Glassjaw header and background weren't saved. The diary photos were, because they were on Photobucket.",
        },
        quote: 'I got a pocket diary (agenda?) yesterday and I "customized" it.',
      },
      {
        date: "2005-12-12",
        title: "hello, mannequin",
        archive: wayback("20051217214720", "http://www.hellomannequin.org/"),
        image: {
          src: "/old-sites/hellomannequin-20051217.png",
          alt: "A white page with one column of grey Verdana blog posts under orange uppercase dates",
          width: 1024,
          height: 921,
          caption: "The header and navigation images weren't saved.",
        },
        quote:
          "I forgot to tell: October 12 was my 16th birthday and I got a Creative Zen Micro which I named Vladimir (after the Russian president).",
      },
    ],
  },
  {
    domain: "paranoiattack.org",
    years: "2005",
    about:
      "My portfolio, in Dutch, for everything I'd made in the two years before. It had skins you could switch between, and was made for Internet Explorer 5.5 at 1024x768.",
    snapshots: [
      {
        date: "2005-04-04",
        title: "PARANOIATTACK.ORG™ ( no girl's just like me. )",
        archive: wayback("20050404200234", "http://paranoiattack.org/"),
        image: {
          src: "/old-sites/paranoiattack-20050404.png",
          alt: "A white page with one small box of Arial text under a pale yellow PORTFOLIO bar",
          width: 1024,
          height: 420,
          caption: "The skin's header and background weren't saved.",
        },
        quote:
          "Welkom op mijn portfolio, hier kun je de dingen vinden die ik heb gemaakt in een periode van meer dan twee jaar.",
      },
    ],
  },
  {
    domain: "sharks.ghostanatomy.org",
    years: "2006",
    about:
      "A subdomain Malene hosted for me, named after a Test Icicles song, with a Greymatter blog. After this one I wanted to blog in Dutch, so I bought suckerlove.org back. The $x signs you see in front of the text are the amount of comments.",
    snapshots: [
      {
        date: "2006-08-20",
        title: "terror at the bay",
        archive: wayback("20060820010238", "http://sharks.ghostanatomy.org/"),
        image: {
          src: "/old-sites/sharks-20060820.png",
          alt: "A pale yellow page with a torn-paper collage of Bill Murray photos and a red S, red Georgia headings, and a column of blog posts in small Verdana",
          width: 1024,
          height: 1181,
          caption: "The header is from the next day's capture. The background wasn't saved.",
        },
        quote:
          "Shall I switch to WordPress? I installed it yesterday and I love the features and plugins and such, but I've grown so attached to Greymatter! I've been using it for like, three years. I'm also thinking of making a Dutch blogsite.",
      },
    ],
  },
  {
    domain: "wakeupsleepyhead.org",
    years: "2007",
    about:
      "An English WordPress blog, back on my own domain after a while on LiveJournal. Its Website page lists every domain before it, and calls it my millionth website.",
    snapshots: [
      {
        date: "2007-03-24",
        title: "Wake up, sleepyhead.",
        archive: wayback("20070325145407", "http://www.wakeupsleepyhead.org/"),
        image: {
          src: "/old-sites/wakeupsleepyhead-20070325.png",
          alt: "An unstyled WordPress page in Times New Roman with blue links, a post about wanting a Sony Ericsson phone, recent posts, tags and an aside about a new layout",
          width: 1000,
          height: 1699,
          caption: "The theme's stylesheet and header weren't saved, so this is the bare HTML.",
        },
        quote:
          "Look, I made a new layout. I like it, I just hope it's not too light. I added some cool quotes from The Office to the footer. The coding of this theme took forever though but it was fun to do. I quite like coding, actually.",
      },
      {
        date: "2007-05-28",
        title: "Why do titles have to be so big in web2.0? It's annoying.",
        archive: wayback("20070602001615", "http://www.wakeupsleepyhead.org/"),
        image: {
          src: "/old-sites/wakeupsleepyhead-20070602.png",
          alt: "An unstyled WordPress page with a big blue Wake up, sleepyhead. heading and a post about exams, Dexter and a Head Automatica concert",
          width: 1000,
          height: 941,
          caption: "A new theme, and again its stylesheet wasn't saved.",
        },
        note: "No page title on this one, so the heading is the latest post's.",
        quote:
          "Wake up, sleepyhead is my millionth website and I'd like to think of it as a fresh start, but it never is.",
      },
    ],
  },
  {
    domain: "airlocklove.com",
    years: "2008",
    about:
      "One page, with Battlestar Galactica in the header. It had a folder of fan images, an archive of the icons I made for LiveJournal, a contact form and a random quote.",
    snapshots: [
      {
        date: "2008-04-08",
        title: "airlock love",
        archive: wayback("20080408145148", "http://www.airlocklove.com/"),
        image: {
          src: "/old-sites/airlocklove-20080408.png",
          alt: "A near-black page with grey headings for Stuff, About, Icons, Contact, Random quote and Etc, cyan links and a grey contact form",
          width: 1024,
          height: 771,
          caption: "The Baltar and Six header and the icon previews weren't saved.",
        },
        quote:
          "Nienke, 18, Europe. Fan of Arrested Development, Battlestar Galactica, Dexter + The Office. Loves Hong Kong, pop culture, Stockholm, humming that watchtower song, Brick Tamland, reading.",
        note: "I went to Hong Kong once...for less than 48 hours. I wish Del.icio.us was still around.",
      },
    ],
  },
  {
    domain: "chocolatebeforedinner.com",
    years: "2009–2013",
    about:
      "This was less a site than a landing page. It containeds a quote, a line about me, and links to my LiveJournal, icons, gifs and recipe lists. My LiveJournal header linked to it as Bob Loblaw Law Blog. 'Chocolate Before Dinner' is a quote from the TV show Lost.",
    snapshots: [
      {
        date: "2010-03-30",
        title: "As if I'm gonna start eating chocolate.",
        archive: wayback("20100330084056", "http://www.chocolatebeforedinner.com/"),
        image: {
          src: "/old-sites/chocolatebeforedinner-20100330.png",
          alt: "A black page with a Tolkien poem in huge bold white sans-serif and a white box of small monospace text with black-highlighted links",
          width: 1280,
          height: 562,
          caption: "The background, Jack from Lost beaten to a pulp, wasn't saved.",
        },
        quote:
          "The background you're looking at right now is of Dr. Jack Shepard beaten to a pulp whilst trying to detonate a hydrogen bomb on a mysterious island somewhere in the Pacific. This layout went live on January 30th, 2010.",
      },
      {
        date: "2011-02-02",
        title: "chocolate before dinner",
        archive: wayback("20110202233522", "http://www.chocolatebeforedinner.com/"),
        image: {
          src: "/old-sites/chocolatebeforedinner-20110202.jpg",
          alt: "A long quote in letter-spaced Georgia in a white box over a purple and pink evening sky, with a one-line box below it",
          width: 1280,
          height: 482,
          caption: "Complete.",
        },
        note: "It stayed like this until 2013.",
        quote: "Student, amateur web designer, professional fangirl, LiveJournal.",
      },
    ],
  },
  {
    domain: "sevenhells.tumblr.com",
    years: "2011–2015",
    about:
      "My Tumblr, mostly reblogged gifsets from Sherlock, Game of Thrones, Battlestar Galactica, Lost and Luther. I later renamed it to shinyhats, one of my usernames, and someone else has had sevenhells since 2020. I think I used the name Helena here to make it less obvious I was Dutch?",
    snapshots: [
      {
        date: "2013-03-19",
        title: "she looks like 22 but she's really 45",
        archive: wayback("20130319051545", "http://sevenhells.tumblr.com/"),
        image: {
          src: "/old-sites/sevenhells-20130319.jpg",
          alt: "A white Tumblr theme with a narrow italic menu, a sidebar headed I'll be mother. with a TV still, and a column of reblogged photos with grey reblog lines, the first a still of Han Solo",
          width: 1024,
          height: 1100,
          caption: "Some reblogged images and my avatar weren't saved. Cropped.",
        },
        quote:
          "helena | 20s | europe | stan for a day. Cylons, gunslingers, weirwoods, browncoats, observers, (consulting) detectives, polar bears, superheroes and biker gangs",
      },
    ],
  },
  {
    domain: "nienke.io",
    years: "2015–2018",
    about:
      "My first developer domain. It started as a Ghost blog on blog.nienke.io, then became a homepage for my side projects: Gif Vault, Media in 2016 and Stupid Hackathon. From 2018 it showed the same site as nienkedekker.com.",
    snapshots: [
      {
        date: "2016-01-24",
        title: "+ blog.nienke.io",
        archive: wayback("20160124001910", "http://blog.nienke.io/"),
        image: {
          src: "/old-sites/blog-nienke-io-20160124.png",
          alt: "An unstyled Ghost blog post in Times New Roman about installing Ghost behind Apache, with code blocks",
          width: 1280,
          height: 1400,
          caption: "The theme's stylesheets weren't saved, so this is the bare HTML.",
        },
        note: "A post about getting Ghost to run on port 80.",
      },
      {
        date: "2016-08-04",
        title: "nienke.io",
        archive: wayback("20160804001226", "https://nienke.io/"),
        image: {
          src: "/old-sites/nienke-io-20160804.jpg",
          alt: "Two columns: pale blue on the left with a pink-tinted photo of me in a snowy scarf, white on the right listing what I do and my side projects",
          width: 1280,
          height: 848,
          caption: "The social icons are empty squares, because their icon font wasn't saved.",
        },
        quote:
          "I like tea and travel. I'm also an aspiring front-end developer living in Amsterdam. I sometimes organize things (Stupid Hackathon AMS, meetups) and if you're into cults, I'll have you know I'm a Level 4 Local Guide.",
      },
      {
        date: "2017-09-25",
        title: "hello!",
        archive: wayback("20170925201541", "https://nienke.io/"),
        image: {
          src: "/old-sites/nienke-io-20170925.jpg",
          alt: "The same two columns, now with round GitHub, Instagram, Twitter and Last.fm icons and a list of what I do with small illustrated icons",
          width: 1280,
          height: 570,
          caption: "Complete, apart from the Last.fm now playing.",
        },
        note: "Same layout a year later, now with a job.",
        quote:
          "I work as a junior front-end developer at TransIP. HTML5 and CSS3 are my true loves.",
      },
    ],
  },
  {
    domain: "stupidhackathon.wtf",
    years: "2016–2018",
    about:
      "Stupid Hackathon Amsterdam, a one-day event for making projects with no value whatsoever. I organised it with Stephanie, and with Derek the first year. There were three, and at the first one I made Geolize.css with Stephanie.",
    snapshots: [
      {
        date: "2016-09-01",
        title: "STUPID HACKATHON AMSTERDAM",
        archive: wayback("20160901041521", "http://www.stupidhackathon.wtf/"),
        image: {
          src: "/old-sites/stupidhackathon-20160901.png",
          alt: "An unstyled page listing the 2016 participants and projects, each with a link to its video",
          width: 1280,
          height: 1600,
          caption:
            "The stylesheet, logo, and background weren't saved, so this is the bare HTML. I vaguely remember an artist actually making us a Van Gogh inspired Nyan Cat image.",
        },
        quote:
          "Geolize.css by Nienke and Stephanie. Geolize is a lightweight CSS reset that renders standard HTML and CSS elements like it's 1999.",
      },
      {
        date: "2017-07-24",
        title: "STUPID HACKATHON AMS",
        archive: wayback("20170724024915", "http://www.stupidhackathon.wtf/"),
        image: {
          src: "/old-sites/stupidhackathon-20170724.png",
          alt: "A white page with a pink Let's Make The Web Weird Again heading, cards with blue headings and a pink-to-blue gradient sign-up button",
          width: 1280,
          height: 1970,
          caption: "The pile of icons in the background wasn't saved.",
        },
        quote:
          "If you'd rather lone wolf it, that's totally fine too. And there will be no prizes, because everyone who participates in a Stupid Hackathon is winning hugely already",
      },
      {
        date: "2018-07-15",
        title: "STUPID HACKATHON AMSTERDAM",
        archive: wayback("20180715002127", "http://www.stupidhackathon.wtf/"),
        image: {
          src: "/old-sites/stupidhackathon-20180715.png",
          alt: "White cards on a light blue background scattered with small coloured shapes, under a pink script Stupid Hackathon 2018 heading",
          width: 1280,
          height: 1881,
          caption: "Complete.",
        },
        note: "The third and last one.",
        quote:
          "Join us for the third edition of Stupid Hackathon Amsterdam: a one-day, small-batch artisanal event where participants conceptualize and create projects that have no value whatsoever, organized by Stephanie and Nienke.",
      },
    ],
  },
  {
    domain: "nienkedekker.com",
    years: "2018–2020",
    about:
      "My name as a domain, until this one. It said the same thing in every layout: frontend developer from Amsterdam, working at the NOS, with a link to what.pm.",
    snapshots: [
      {
        date: "2019-01-25",
        title: "Nienke Dekker",
        archive: wayback("20190125082855", "https://nienkedekker.com/"),
        image: {
          src: "/old-sites/nienkedekker-20190125.png",
          alt: "A white page with large black text, yellow-highlighted links and columns for blog posts, contact links and other links",
          width: 1280,
          height: 527,
          caption: "The blog post list is empty here.",
        },
        quote:
          "My name is Nienke Dekker, and I'm a frontend developer from Amsterdam. I sometimes organize things, like the Stupid Hackathon Amsterdam. I work at the NOS, focusing on creating clean, compliant and performant code.",
      },
      {
        date: "2019-11-17",
        title: "My name is Nienke Dekker,",
        archive: wayback("20191117161748", "https://nienkedekker.com/"),
        image: {
          src: "/old-sites/nienkedekker-20191117.png",
          alt: "A dark navy page with a big lavender heading and monospace labels over a list of blog posts, contact links and other links",
          width: 1280,
          height: 718,
          caption: "Complete.",
        },
        note: "No page title on this one, so the heading is the page's own.",
        quote:
          "Some technologies I've recently worked with are Vue, Node, TypeScript, and the JAMstack. I'm also interested in domain driven design principles and patterns and how they can be applied to frontend software engineering.",
      },
      {
        date: "2020-09-20",
        title: "Nienke Dekker",
        archive: wayback("20200920045623", "https://nienkedekker.com/"),
        image: {
          src: "/old-sites/nienkedekker-20200920.png",
          alt: "A dark navy page with a warning that the site is being redone, a big grey heading and links to Twitter, GitHub, e-mail, an outdated blog, book recs and What.pm",
          width: 1280,
          height: 483,
          caption: "Complete.",
        },
        note: "Rebuilt with Nuxt, shortly before nienke.dev.",
        quote: "🚧 I'M REDOING THIS SITE, if you run into issues please do not let me know 😗️💕😃",
      },
    ],
  },
  {
    domain: "nienke.dev",
    years: "2020–now",
    about:
      "The domain I moved to in August 2020. It was built with Nuxt, rebuilt with Next.js in November 2023, and has been Astro since December 2025, which is the version you're reading now.",
    snapshots: [
      {
        date: "2020-08-08",
        title: "Nienke Dekker",
        archive: wayback("20200808210411", "https://nienke.dev/"),
        image: {
          src: "/old-sites/nienkedev-20200808.png",
          alt: "A dark navy page with a large light grey introduction, and monospace GET IN TOUCH and OTHER headings over emoji links to Twitter, GitHub, e-mail, humans.txt and what.pm",
          width: 1280,
          height: 459,
          caption: "Complete.",
        },
        quote:
          "My name is Nienke Dekker, and I'm a frontend developer from Amsterdam. I work at the NOS, focusing on creating clean and performant code.",
      },
      {
        date: "2022-07-29",
        title: "Nienke Dekker",
        archive: wayback("20220729192007", "https://nienke.dev/"),
        image: {
          src: "/old-sites/nienkedev-20220729.jpg",
          alt: "A white page with a photo of Nienke at a restaurant table next to the heading Hi, I'm Nienke. and a short introduction",
          width: 1280,
          height: 486,
          caption: "Complete.",
        },
        quote:
          "I'm a software developer from Amsterdam. I work at Daily! 🤙 You can find me on Twitter or GitHub. My forever side project is what.pm.",
      },
      {
        date: "2025-01-21",
        title: "Nienke Dekker",
        archive: wayback("20250121113019", "https://nienke.dev/"),
        image: {
          src: "/old-sites/nienkedev-20250121.jpg",
          alt: "A light grey page with the same restaurant photo next to a bold Hi, I'm Nienke! heading and three short paragraphs",
          width: 1280,
          height: 630,
          caption:
            "The Next.js version, live from November 2023. This capture is from January 2025, because the stylesheet in the earlier ones wasn't saved.",
        },
        quote:
          "I'm a software developer based in Amsterdam. I've been building websites all my life.",
      },
    ],
  },
];
