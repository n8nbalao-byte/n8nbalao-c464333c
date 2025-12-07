const integrations = [
  { name: "Google", icon: "🔷" },
  { name: "Slack", icon: "💬" },
  { name: "Excel", icon: "📊" },
  { name: "Trello", icon: "📋" },
  { name: "Dropbox", icon: "📦" },
  { name: "GitHub", icon: "🐙" },
  { name: "Discord", icon: "🎮" },
  { name: "Microsoft", icon: "🪟" },
  { name: "Salesforce", icon: "☁️" },
  { name: "HubSpot", icon: "🧡" },
  { name: "Mailchimp", icon: "📧" },
  { name: "Stripe", icon: "💳" },
  { name: "Shopify", icon: "🛒" },
  { name: "WordPress", icon: "📝" },
  { name: "Figma", icon: "🎨" },
  { name: "Notion", icon: "📓" },
];

export function IntegrationsCarousel() {
  return (
    <section className="py-16 overflow-hidden">
      <div className="container mb-8">
        <h2 className="text-3xl font-bold text-foreground text-center lg:text-4xl">
          Conecte com suas ferramentas favoritas
        </h2>
        <p className="mt-4 text-muted-foreground text-center">
          Integre o WhatsAppBot com as principais plataformas do mercado
        </p>
      </div>

      <div className="relative">
        {/* First row - scrolling left */}
        <div className="flex animate-scroll-left">
          {[...integrations, ...integrations].map((item, index) => (
            <div
              key={`row1-${index}`}
              className="flex-shrink-0 mx-4 px-6 py-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm flex items-center gap-3 min-w-[160px]"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-sm font-medium text-foreground">{item.name}</span>
            </div>
          ))}
        </div>

        {/* Second row - scrolling right */}
        <div className="flex animate-scroll-right mt-4">
          {[...integrations.slice().reverse(), ...integrations.slice().reverse()].map((item, index) => (
            <div
              key={`row2-${index}`}
              className="flex-shrink-0 mx-4 px-6 py-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm flex items-center gap-3 min-w-[160px]"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-sm font-medium text-foreground">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
