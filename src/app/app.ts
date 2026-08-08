import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly menuOpen = signal(false);

  private readonly whatsappPhone = '5521981394290';

  protected readonly instagramUrl = 'https://www.instagram.com/andrrereis';
  protected readonly cref = '047611-G/RJ';

  protected readonly whatsappAvaliacao = this.buildWhatsAppLink(
    'Olá, André! Quero agendar uma avaliação física.',
  );

  protected readonly whatsappComecar = this.buildWhatsAppLink(
    'Olá, André! Quero começar meu acompanhamento personalizado.',
  );

  protected readonly navLinks = [
    { label: 'Método', href: '#diferenca' },
    { label: 'Benefícios', href: '#beneficios' },
    { label: 'Para quem', href: '#para-quem' },
    { label: 'Atendimento', href: '#atendimento' },
    { label: 'Sobre', href: '#sobre' },
  ] as const;

  protected readonly heroBenefits = [
    'Treino totalmente personalizado',
    'Acompanhamento contínuo',
    'Correção dos exercícios por vídeo',
    'Avaliações e ajustes frequentes',
  ] as const;

  protected readonly benefits = [
    {
      title: 'Treino Personalizado',
      description:
        'Nada de planilhas genéricas. Seu treino é desenvolvido exclusivamente para seus objetivos, experiência, rotina e disponibilidade.',
      items: [
        'Hipertrofia',
        'Emagrecimento',
        'Corrida',
        'Condicionamento físico',
        'Qualidade de vida',
      ],
      icon: 'clipboard' as const,
    },
    {
      title: 'Suporte Contínuo',
      description:
        'Você não fica sozinho. Durante toda a consultoria você recebe acompanhamento para tirar dúvidas, fazer ajustes e manter sua evolução constante.',
      items: [] as string[],
      icon: 'support' as const,
    },
    {
      title: 'Correção dos Exercícios',
      description:
        'Envie vídeos dos seus treinos e receba uma análise detalhada da execução. Isso reduz o risco de lesões e melhora significativamente seus resultados.',
      items: [] as string[],
      icon: 'video' as const,
    },
    {
      title: 'Avaliação Física',
      description:
        'Acompanhamento da sua evolução através de avaliações periódicas. Assim conseguimos ajustar seu planejamento sempre que necessário.',
      items: [] as string[],
      icon: 'chart' as const,
    },
  ];

  protected readonly audience = [
    'Quem quer emagrecer com saúde',
    'Quem deseja ganhar massa muscular',
    'Quem quer melhorar o condicionamento físico',
    'Corredores de todos os níveis',
    'Gestantes',
    'Puérperas',
    'Idosos',
    'Pessoas que querem voltar a treinar com segurança',
  ] as const;

  protected readonly formation = [
    'Pós-graduação em Cinesiologia, Biomecânica e Treinamento Físico',
    'Pós-graduação em Psicomotricidade',
    'Especialização em Pilates',
    'Graduando em Nutrição',
    'Pós-graduação em andamento em Suplementação e Nutrição Esportiva',
  ] as const;

  protected readonly specialties = [
    'Hipertrofia',
    'Emagrecimento',
    'Corrida',
    'Condicionamento Físico',
    'Pilates',
    'Gestantes',
    'Puérperas',
    'Idosos',
  ] as const;

  protected readonly reasons = [
    'Mais de 10 anos de experiência',
    'Treino realmente individualizado',
    'Acompanhamento próximo',
    'Correção técnica dos exercícios',
    'Planejamento baseado em evidências científicas',
    'Evolução acompanhada através de avaliações',
    'Atendimento presencial e online',
  ] as const;

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  private buildWhatsAppLink(message: string): string {
    const text = encodeURIComponent(message);
    return `https://wa.me/${this.whatsappPhone}?text=${text}`;
  }
}
