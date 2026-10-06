import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NgStyle } from '@angular/common';

type StepId = 'name' | 'age' | 'city' | 'goal' | 'difficulty' | 'done';

interface ChatMessage {
  id: number;
  from: 'bot' | 'user';
  text: string;
}

@Component({
  selector: 'app-assistant-chat',
  imports: [NgStyle],
  templateUrl: './assistant-chat.html',
  styleUrl: './assistant-chat.css',
})
export class AssistantChat {
  private readonly destroyRef = inject(DestroyRef);
  private readonly messagesEl = viewChild<ElementRef<HTMLElement>>('messagesBox');
  private readonly chatInput = viewChild<ElementRef<HTMLInputElement>>('chatInput');
  private messageId = 0;
  private lastPanelKey = '';

  private readonly whatsappPhone = '5521981394290';

  protected readonly open = signal(false);
  protected readonly inputValue = signal('');
  protected readonly typing = signal(false);
  protected readonly step = signal<StepId>('name');
  protected readonly messages = signal<ChatMessage[]>([]);
  protected readonly mobileSheet = signal(false);
  protected readonly panelStyle = signal<Record<string, string>>({});
  protected readonly answers = signal({
    name: '',
    age: '',
    city: '',
    goal: '',
    difficulty: '',
  });

  protected readonly goalOptions = [
    'Ganhar massa muscular',
    'Emagrecer com saúde',
    'Evoluir na corrida',
    'Melhorar o condicionamento',
    'Gestante / pós-parto',
    'Qualidade de vida',
    'Voltar a treinar',
  ] as const;

  protected readonly difficultyOptions = [
    'Falta de motivação',
    'Não sei se executo certo',
    'Pouco tempo na rotina',
    'Lesão ou limitação',
    'Treino sem resultado',
    'Não sei por onde começar',
  ] as const;

  constructor() {
    afterNextRender(() => {
      const sync = () => this.syncPanelToViewport();
      const vv = window.visualViewport;
      vv?.addEventListener('resize', sync);
      vv?.addEventListener('scroll', sync);
      window.addEventListener('resize', sync);
      this.destroyRef.onDestroy(() => {
        vv?.removeEventListener('resize', sync);
        vv?.removeEventListener('scroll', sync);
        window.removeEventListener('resize', sync);
      });
    });

    effect(() => {
      if (this.open()) {
        queueMicrotask(() => this.syncPanelToViewport());
      } else {
        this.mobileSheet.set(false);
        this.panelStyle.set({});
        this.lastPanelKey = '';
      }
    });
  }

  protected toggle(): void {
    this.open.update((v) => !v);
    if (this.open() && this.messages().length === 0) {
      this.startConversation();
    }
    queueMicrotask(() => {
      this.syncPanelToViewport();
      this.scrollToBottom();
      if (this.open() && this.needsTextInput()) {
        this.focusInput();
      }
    });
  }

  protected close(): void {
    this.open.set(false);
  }

  protected currentChoices(): readonly string[] | null {
    const s = this.step();
    if (s === 'goal') return this.goalOptions;
    if (s === 'difficulty') return this.difficultyOptions;
    return null;
  }

  protected needsTextInput(): boolean {
    const s = this.step();
    return s === 'name' || s === 'age' || s === 'city';
  }

  protected composerHint(): string {
    if (this.step() === 'done') return 'Quase lá...';
    if (this.currentChoices()) return 'Escolha uma opção acima';
    return '';
  }

  protected inputPlaceholder(): string {
    switch (this.step()) {
      case 'name':
        return 'Digite seu nome...';
      case 'age':
        return 'Digite sua idade...';
      case 'city':
        return 'Digite sua cidade...';
      default:
        return 'Digite sua resposta...';
    }
  }

  protected inputType(): string {
    return this.step() === 'age' ? 'number' : 'text';
  }

  protected submitText(): void {
    const value = this.inputValue().trim();
    if (!value || this.typing() || !this.needsTextInput()) return;

    const s = this.step();
    if (s === 'age' && (!/^\d{1,3}$/.test(value) || Number(value) < 10 || Number(value) > 100)) {
      this.pushBot('Me conta uma idade válida, por favor (só o número).');
      this.inputValue.set('');
      this.focusInput();
      return;
    }

    this.pushUser(value);
    this.inputValue.set('');

    if (s === 'name') {
      this.answers.update((a) => ({ ...a, name: value }));
      this.askNext('age', `Prazer, ${value.split(' ')[0]}! Qual a sua idade?`, true);
    } else if (s === 'age') {
      this.answers.update((a) => ({ ...a, age: value }));
      this.askNext('city', 'Em qual cidade você mora?', true);
    } else if (s === 'city') {
      this.answers.update((a) => ({ ...a, city: value }));
      this.askNext(
        'goal',
        'Perfeito. Qual é o seu principal objetivo agora? Escolha uma opção:',
        false,
      );
    }
  }

  protected selectChoice(option: string): void {
    if (this.typing()) return;
    const s = this.step();
    if (s !== 'goal' && s !== 'difficulty') return;

    this.pushUser(option);

    if (s === 'goal') {
      this.answers.update((a) => ({ ...a, goal: option }));
      this.askNext(
        'difficulty',
        'E qual é a sua maior dificuldade hoje? Escolha uma opção:',
        false,
      );
    } else {
      this.answers.update((a) => ({ ...a, difficulty: option }));
      this.finish();
    }
  }

  protected whatsappUrl(): string {
    const a = this.answers();
    const message = [
      'Olá, André! Quero começar meu acompanhamento personalizado.',
      '',
      `Nome: ${a.name}`,
      `Idade: ${a.age}`,
      `Cidade: ${a.city}`,
      `Objetivo: ${a.goal}`,
      `Maior dificuldade: ${a.difficulty}`,
    ].join('\n');
    return `https://wa.me/${this.whatsappPhone}?text=${encodeURIComponent(message)}`;
  }

  protected restart(): void {
    this.messages.set([]);
    this.answers.set({ name: '', age: '', city: '', goal: '', difficulty: '' });
    this.step.set('name');
    this.inputValue.set('');
    this.startConversation();
  }

  private syncPanelToViewport(): void {
    if (!this.open() || typeof window === 'undefined') return;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (!isMobile) {
      this.mobileSheet.set(false);
      this.panelStyle.set({});
      this.lastPanelKey = '';
      return;
    }

    this.mobileSheet.set(true);

    const vv = window.visualViewport;
    const offsetTop = vv?.offsetTop ?? 0;
    const vvHeight = vv?.height ?? window.innerHeight;

    // Sempre ancora no rodapé da área visível (acima do teclado).
    // Nunca troca entre top/bottom, isso evita o "pulo" a cada pergunta.
    const bottom = Math.round(Math.max(0, window.innerHeight - offsetTop - vvHeight));
    const height = Math.round(Math.min(vvHeight - 10, Math.max(300, vvHeight * 0.82)));
    const key = `${bottom}:${height}`;

    if (key === this.lastPanelKey) return;
    this.lastPanelKey = key;

    this.panelStyle.set({
      top: 'auto',
      bottom: `${bottom}px`,
      height: `${height}px`,
      maxHeight: `${height}px`,
      left: '0',
      right: '0',
      width: '100%',
      borderRadius: '1.1rem 1.1rem 0 0',
    });
  }

  private startConversation(): void {
    if (this.messages().length > 0) return;
    this.typing.set(true);
    this.delay(500).then(() => {
      this.typing.set(false);
      this.pushBot(
        'Oi! Sou o André Reis. Vou te fazer algumas perguntas rápidas para entender melhor o seu momento e te orientar no acompanhamento.',
      );
      this.typing.set(true);
      return this.delay(700);
    }).then(() => {
      this.typing.set(false);
      this.pushBot('Primeiro: qual o seu nome?');
      this.step.set('name');
      this.scrollToBottom();
      this.focusInput();
    });
  }

  private askNext(next: StepId, text: string, keepKeyboard: boolean): void {
    this.step.set(next);
    this.typing.set(true);
    if (!keepKeyboard) {
      this.chatInput()?.nativeElement?.blur();
    }
    this.delay(550).then(() => {
      this.typing.set(false);
      this.pushBot(text);
      this.scrollToBottom();
      if (keepKeyboard) {
        this.focusInput();
      }
    });
  }

  private finish(): void {
    this.step.set('done');
    this.typing.set(true);
    this.delay(350).then(() => {
      this.typing.set(false);
      const name = this.answers().name.split(' ')[0] || 'aí';
      this.pushBot(`Perfeito, ${name}! Te direcionando para o WhatsApp agora...`);
      this.scrollToBottom();
      return this.delay(450);
    }).then(() => {
      window.open(this.whatsappUrl(), '_blank', 'noopener,noreferrer');
    });
  }

  private focusInput(): void {
    setTimeout(() => {
      this.chatInput()?.nativeElement?.focus({ preventScroll: true });
      this.scrollToBottom();
    }, 80);
  }

  private pushBot(text: string): void {
    this.messages.update((list) => [...list, { id: ++this.messageId, from: 'bot', text }]);
    this.scrollToBottom();
  }

  private pushUser(text: string): void {
    this.messages.update((list) => [...list, { id: ++this.messageId, from: 'user', text }]);
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    queueMicrotask(() => {
      const el = this.messagesEl()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
