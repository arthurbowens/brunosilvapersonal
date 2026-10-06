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
  private messageId = 0;
  private inputFocused = false;

  private readonly whatsappPhone = '5521981394290';

  protected readonly open = signal(false);
  protected readonly inputValue = signal('');
  protected readonly typing = signal(false);
  protected readonly step = signal<StepId>('name');
  protected readonly messages = signal<ChatMessage[]>([]);
  protected readonly keyboardMode = signal(false);
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
        this.inputFocused = false;
        this.keyboardMode.set(false);
        this.panelStyle.set({});
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
    });
  }

  protected close(): void {
    this.open.set(false);
  }

  protected onInputFocus(): void {
    this.inputFocused = true;
    this.syncPanelToViewport();
    setTimeout(() => {
      this.syncPanelToViewport();
      this.scrollToBottom();
    }, 350);
  }

  protected onInputBlur(): void {
    this.inputFocused = false;
    setTimeout(() => this.syncPanelToViewport(), 150);
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
      return;
    }

    this.pushUser(value);
    this.inputValue.set('');

    if (s === 'name') {
      this.answers.update((a) => ({ ...a, name: value }));
      this.askNext('age', `Prazer, ${value.split(' ')[0]}! Qual a sua idade?`);
    } else if (s === 'age') {
      this.answers.update((a) => ({ ...a, age: value }));
      this.askNext('city', 'Em qual cidade você mora?');
    } else if (s === 'city') {
      this.answers.update((a) => ({ ...a, city: value }));
      this.askNext(
        'goal',
        'Perfeito. Qual é o seu principal objetivo agora? Escolha uma opção:',
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
      this.keyboardMode.set(false);
      this.panelStyle.set({});
      return;
    }

    const vv = window.visualViewport;
    if (!vv) return;

    const covered = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    const keyboardUp = this.inputFocused || covered > 100;
    this.keyboardMode.set(keyboardUp);

    if (keyboardUp) {
      const top = vv.offsetTop + 6;
      const height = Math.max(240, vv.height - 12);
      this.panelStyle.set({
        top: `${top}px`,
        bottom: 'auto',
        height: `${height}px`,
        maxHeight: `${height}px`,
        right: '0.65rem',
        left: '0.65rem',
        width: 'auto',
      });
    } else {
      const bottomInset = Math.max(0, window.innerHeight - (vv.offsetTop + vv.height));
      this.panelStyle.set({
        top: 'auto',
        bottom: `${bottomInset + 68}px`,
        height: `${Math.min(vv.height * 0.58, 28 * 16)}px`,
        maxHeight: `${Math.max(260, vv.height - 90)}px`,
        right: '0.85rem',
        left: 'auto',
        width: 'min(calc(100vw - 1.7rem), 21rem)',
      });
    }

    this.scrollToBottom();
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
    });
  }

  private askNext(next: StepId, text: string): void {
    this.step.set(next);
    this.typing.set(true);
    this.delay(650).then(() => {
      this.typing.set(false);
      this.pushBot(text);
      this.scrollToBottom();
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
