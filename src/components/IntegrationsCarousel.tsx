const integrations = [
  { name: "Google", icon: "fab fa-google", url: "https://www.google.com" },
  { name: "Slack", icon: "fab fa-slack", url: "https://slack.com" },
  { name: "Excel", icon: "fas fa-table", url: "https://www.microsoft.com/excel" },
  { name: "Trello", icon: "fab fa-trello", url: "https://trello.com" },
  { name: "Dropbox", icon: "fab fa-dropbox", url: "https://www.dropbox.com" },
  { name: "GitHub", icon: "fab fa-github", url: "https://github.com" },
  { name: "Discord", icon: "fab fa-discord", url: "https://discord.com" },
  { name: "Microsoft", icon: "fab fa-microsoft", url: "https://www.microsoft.com" },
];

const integrationsRow2 = [
  { name: "Salesforce", icon: "fab fa-salesforce", url: "https://www.salesforce.com" },
  { name: "HubSpot", icon: "fab fa-hubspot", url: "https://www.hubspot.com" },
  { name: "Mailchimp", icon: "fab fa-mailchimp", url: "https://mailchimp.com" },
  { name: "Stripe", icon: "fab fa-stripe", url: "https://stripe.com" },
  { name: "Shopify", icon: "fab fa-shopify", url: "https://www.shopify.com" },
  { name: "WordPress", icon: "fab fa-wordpress", url: "https://wordpress.com" },
  { name: "Figma", icon: "fab fa-figma", url: "https://www.figma.com" },
  { name: "Notion", icon: "fab fa-notion", url: "https://www.notion.so" },
];

export function IntegrationsCarousel() {
  const handleCardClick = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="py-16 overflow-hidden">
      <div className="container mb-8">
        <h2 className="text-3xl font-bold text-foreground text-center lg:text-4xl">
          Conecte com suas ferramentas favoritas e{" "}
          <span className="text-primary">mais de 500 integrações</span>
        </h2>
        <p className="mt-4 text-muted-foreground text-center">
          Integre o WhatsAppBot com as principais plataformas do mercado
        </p>
      </div>

      <div className="relative">
        {/* First row - scrolling left */}
        <div className="flex animate-scroll-left">
          {[...integrations, ...integrations, ...integrations].map((item, index) => (
            <div
              key={`row1-${index}`}
              onClick={() => handleCardClick(item.url)}
              className="flex-shrink-0 mx-3 px-6 py-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm flex items-center gap-3 min-w-[160px] cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-all hover:scale-105"
            >
              <i className={`${item.icon} text-2xl text-primary`}></i>
              <span className="text-sm font-medium text-foreground">{item.name}</span>
            </div>
          ))}
        </div>

        {/* Second row - scrolling right */}
        <div className="flex animate-scroll-right mt-4">
          {[...integrationsRow2, ...integrationsRow2, ...integrationsRow2].map((item, index) => (
            <div
              key={`row2-${index}`}
              onClick={() => handleCardClick(item.url)}
              className="flex-shrink-0 mx-3 px-6 py-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm flex items-center gap-3 min-w-[160px] cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-all hover:scale-105"
            >
              <i className={`${item.icon} text-2xl text-primary`}></i>
              <span className="text-sm font-medium text-foreground">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
