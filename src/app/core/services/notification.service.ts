import { Injectable } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
import Swal from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private router: Router) {}

  private centralAnim = {
    showClass: { popup: 'animate__animated animate__fadeInDown' },
    hideClass: { popup: 'animate__animated animate__fadeOutUp' }
  };

  /** Modal centralizado de sucesso (confirmação manual) */
  successCenter(
    title: string,
    text?: string,
    confirmText: string = 'Ok',
    afterConfirm?: () => void
  ) {
    return Swal.fire({
      ...this.centralAnim,
      icon: 'success',
      title,
      text,
      confirmButtonText: confirmText
    }).then(r => {
      if (r.isConfirmed && afterConfirm) afterConfirm();
    });
  }

  infoCenter(
    title: string,
    text?: string,
    confirmText: string = 'Ok',
    afterConfirm?: () => void
  ) {
    return Swal.fire({
      ...this.centralAnim,
      icon: 'info',
      title,
      text,
      confirmButtonText: confirmText
    }).then(r => {
      if (r.isConfirmed && afterConfirm) afterConfirm();
    });
  }

  /** Modal centralizado de erro (confirmação manual) */
  errorCenter(title: string = 'Erro', text?: string, footer?: string) {
    return Swal.fire({
      ...this.centralAnim,
      icon: 'error',
      title,
      text,
      ...(footer ? { footer } : {}),
      confirmButtonText: 'Ok'
    });
  }

  /** Modal de confirmação (retorna o resultado do SweetAlert2) */
  async confirm(
    title: string,
    text: string,
    confirmButtonText = 'Sim',
    cancelButtonText = 'Cancelar'
  ): Promise<boolean> {
    const result = await Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    });

    return result.isConfirmed; // 👈 só retorna true se clicou em "Sim"
  }

  /** Toast rápido de sucesso (canto da tela) */
  toastSuccess(title: string, ms: number = 2000, position: any = 'top-end') {
    return Swal.fire({
      toast: true,
      position,
      icon: 'success',
      title,
      showConfirmButton: false,
      timer: ms
    });
  }

  /** Toast rápido de erro (canto da tela) */
  toastError(title: string, ms: number = 2500, position: any = 'top-end') {
    return Swal.fire({
      toast: true,
      position,
      icon: undefined,
      title: `⚠️ ${title}`, // 👈 emoji leve
      showConfirmButton: false,
      timer: ms,
      customClass: {
        popup: 'kazaz-toast'
      }
    });
  }

  /** Redireciona após confirmar no modal central */
  successCenterRedirect(
    title: string,
    text: string | undefined,
    commands: any[],
    extras?: NavigationExtras,
    confirmText: string = 'Ok'
  ) {
    return this.successCenter(title, text, confirmText, () =>
      this.router.navigate(commands, extras)
    );
  }

  /** Redireciona após o toast (auto-close) */
  toastSuccessRedirect(
    title: string,
    commands: any[],
    extras?: NavigationExtras,
    ms: number = 2000,
    position: any = 'top-end'
  ) {
    return this.toastSuccess(title, ms, position).then(() =>
      this.router.navigate(commands, extras)
    );
  }

  /** Tratamento prático de erros de API */
  handleHttpError(err: any, fallbackMsg: string = 'Falha ao processar sua solicitação.') {
    const apiMsg =
      err?.error?.message ||
      err?.error?.title ||
      err?.message ||
      fallbackMsg;

    return this.errorCenter('Erro', apiMsg);
  }
}
