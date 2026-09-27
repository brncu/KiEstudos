import { Link } from "@tanstack/react-router";
import { Zap, ListChecks, FileQuestion, Timer, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function QuickActionCards() {
  const actions = [
    {
      id: "flashcards",
      to: "/flashcards",
      title: "Praticar Flashcards",
      description:
        "Revisão ativa com repetição espaçada SM-2. Memorize lei seca e conceitos-chave.",
      badge: "0 pendentes hoje",
      badgeColor: "bg-primary/15 text-primary border-primary/20",
      icon: Zap,
      iconBg:
        "bg-primary/10 border-primary/25 text-primary group-hover:bg-primary group-hover:text-on-primary",
      accentBorder: "hover:border-primary/50",
      cta: "Praticar Agora",
    },
    {
      id: "edital",
      to: "/edital",
      title: "Acompanhar Edital",
      description:
        "Edital verticalizado interativo. Monitore teoria, questões e revisões por tópico.",
      badge: "0% concluído",
      badgeColor: "bg-secondary/15 text-secondary border-secondary/20",
      icon: ListChecks,
      iconBg:
        "bg-secondary/10 border-secondary/25 text-secondary group-hover:bg-secondary group-hover:text-on-secondary",
      accentBorder: "hover:border-secondary/50",
      cta: "Ver Syllabus",
    },
    {
      id: "questoes",
      to: "/questoes",
      title: "Resolver Questões",
      description:
        "Filtre por banca (Cesgranrio, FGV, Cebraspe), cargo, ano e comentários de professores.",
      badge: "0 questões",
      badgeColor: "bg-primary/15 text-primary border-primary/20",
      icon: FileQuestion,
      iconBg:
        "bg-primary/10 border-primary/25 text-primary group-hover:bg-primary group-hover:text-on-primary",
      accentBorder: "hover:border-primary/50",
      cta: "Filtrar Baterias",
    },
    {
      id: "simulado",
      to: "/simulado",
      title: "Iniciar Simulado",
      description:
        "Exame cronometrado com 70 questões no padrão oficial da banca e ranking global.",
      badge: "Tempo Real",
      badgeColor: "bg-tertiary/15 text-tertiary border-tertiary/20",
      icon: Timer,
      iconBg:
        "bg-tertiary/10 border-tertiary/25 text-tertiary group-hover:bg-tertiary group-hover:text-on-tertiary",
      accentBorder: "hover:border-tertiary/50",
      cta: "Simulado Oficial",
    },
  ];

  return (
    <section aria-label="Atalhos Rápidos de Estudo" className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-secondary" aria-hidden="true" />
          <h2 className="font-headline-md text-headline-sm font-bold text-on-surface tracking-tight">
            Ações Rápidas de Estudo
          </h2>
        </div>
        <span className="font-label-caps text-xs text-outline uppercase">Módulos Integrados</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.id}
              to={action.to}
              className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
            >
              <Card
                className={`h-full bg-surface-container-low border border-outline-variant/40 ${action.accentBorder} transition-all duration-300 rounded-2xl p-5 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1`}
              >
                <CardContent className="p-0 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-300 ${action.iconBg}`}
                      >
                        <Icon
                          className="w-5 h-5 transition-transform duration-300 group-hover:scale-110"
                          aria-hidden="true"
                        />
                      </div>
                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-label-caps font-bold border ${action.badgeColor}`}
                      >
                        {action.badge}
                      </span>
                    </div>

                    <h3 className="font-headline-md text-base font-bold text-on-surface group-hover:text-primary transition-colors tracking-tight">
                      {action.title}
                    </h3>
                    <p className="mt-1 text-xs text-on-surface-variant font-body-sm line-clamp-2 leading-relaxed">
                      {action.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between text-xs font-headline-sm font-semibold text-primary">
                    <span>{action.cta}</span>
                    <ArrowRight
                      className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
