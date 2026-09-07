'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { DropdownMenu, MenuItem, MenuSeparator } from '@/components/ui/menu';
import { Modal } from '@/components/ui/modal';
import { SubmitButton } from '@/components/ui/submit-button';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils/cn';
import { POST_TYPE } from '@/lib/labels';
import { formatRelative } from '@/lib/utils/format';
import { REPORT_REASONS } from '@/lib/validation/community';
import { INITIAL_FORM_STATE } from '@/server/actions/form-state';
import {
  createCommentAction,
  createReportAction,
  setPostCommentsAction,
  toggleLikeAction,
  toggleSavePostAction,
} from '@/server/actions/posts';

export type PostCardData = {
  id: string;
  type: keyof typeof POST_TYPE;
  caption: string;
  city: string | null;
  state: string | null;
  stage: string | null;
  allowComments: boolean;
  createdAt: string;
  likedByMe: boolean;
  savedByMe: boolean;
  likeCount: number;
  commentCount: number;
  author: {
    id: string;
    username: string | null;
    displayName: string;
    avatarUrl: string | null;
  };
  plant: { slug: string; label: string } | null;
  images: { id: string; url: string; alt: string }[];
  tags: string[];
};

export type CommentData = {
  id: string;
  body: string;
  createdAt: string;
  author: { username: string | null; displayName: string; avatarUrl: string | null };
};

export function PostCard({
  post,
  comments,
  viewerId,
  isAuthenticated,
}: {
  post: PostCardData;
  comments?: CommentData[];
  viewerId: string | null;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const { notify } = useToast();

  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [saved, setSaved] = useState(post.savedByMe);
  const [allowComments, setAllowComments] = useState(post.allowComments);
  const [showComments, setShowComments] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<string>('SPAM');
  const [imageIndex, setImageIndex] = useState(0);
  const [pending, startTransition] = useTransition();

  const [commentState, commentAction] = useActionState(
    createCommentAction,
    INITIAL_FORM_STATE,
  );

  const isOwner = viewerId === post.author.id;
  const typeInfo = POST_TYPE[post.type];

  useEffect(() => {
    if (commentState.status === 'success') {
      notify(commentState.message ?? 'Comentário publicado.', 'success');
      router.refresh();
    } else if (commentState.status === 'error' && !commentState.fieldErrors) {
      notify(commentState.message ?? 'Não foi possível comentar.', 'error');
    }
  }, [commentState, notify, router]);

  function guard(): boolean {
    if (isAuthenticated) return false;
    router.push(`/entrar?proximo=${encodeURIComponent('/feed')}`);
    return true;
  }

  function handleLike() {
    if (guard()) return;
    const previous = liked;
    setLiked(!previous);
    setLikeCount((count) => count + (previous ? -1 : 1));

    startTransition(async () => {
      const result = await toggleLikeAction(post.id);
      if (!result.ok) {
        setLiked(previous);
        setLikeCount((count) => count + (previous ? 1 : -1));
        notify(result.message ?? 'Não foi possível curtir agora.', 'error');
      }
    });
  }

  function handleSave() {
    if (guard()) return;
    const previous = saved;
    setSaved(!previous);

    startTransition(async () => {
      const result = await toggleSavePostAction(post.id);
      if (!result.ok) {
        setSaved(previous);
        notify(result.message ?? 'Não foi possível salvar agora.', 'error');
      } else {
        notify(result.active ? 'Publicação salva.' : 'Removida dos salvos.', 'success');
      }
    });
  }

  function toggleCommentSetting() {
    const next = !allowComments;
    setAllowComments(next);
    startTransition(async () => {
      const result = await setPostCommentsAction(post.id, next);
      if (!result.ok) {
        setAllowComments(!next);
        notify(result.message, 'error');
      } else {
        notify(result.message, 'success');
      }
    });
  }

  function submitReport() {
    startTransition(async () => {
      const result = await createReportAction({
        targetType: 'POST',
        targetId: post.id,
        reason: reportReason,
        details: null,
      });
      notify(result.message, result.ok ? 'success' : 'error');
      if (result.ok) setReportOpen(false);
    });
  }

  return (
    <article className="overflow-hidden rounded-lg border border-ink-200 bg-white">
      {/* Cabeçalho */}
      <header className="flex items-center gap-3 p-3.5">
        <Link
          href={post.author.username ? `/perfil/${post.author.username}` : '#'}
          className="shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          <Avatar
            name={post.author.displayName}
            src={post.author.avatarUrl}
            size="md"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <p className="truncate">
            <Link
              href={post.author.username ? `/perfil/${post.author.username}` : '#'}
              className="font-medium text-ink-900 hover:text-brand-700"
            >
              {post.author.displayName}
            </Link>
          </p>
          <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-ink-500">
            <time dateTime={post.createdAt}>{formatRelative(post.createdAt)}</time>
            {post.city ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-0.5">
                  <Icon name="mapPin" size={11} />
                  {post.city}
                  {post.state ? `, ${post.state}` : ''}
                </span>
              </>
            ) : null}
          </p>
        </div>

        <Badge tone={typeInfo.tone} icon={typeInfo.icon}>
          {typeInfo.label}
        </Badge>

        <DropdownMenu
          label="Mais opções da publicação"
          trigger={
            <span className="flex h-9 w-9 items-center justify-center rounded-md text-ink-500 hover:bg-ink-100">
              <Icon name="moreHorizontal" size={18} />
            </span>
          }
        >
          {isOwner ? (
            <>
              <MenuItem
                icon={allowComments ? 'messageOff' : 'message'}
                onClick={toggleCommentSetting}
              >
                {allowComments ? 'Desativar comentários' : 'Ativar comentários'}
              </MenuItem>
              <MenuSeparator />
            </>
          ) : null}
          <MenuItem
            icon="flag"
            tone="danger"
            onClick={() => {
              if (guard()) return;
              setReportOpen(true);
            }}
          >
            Denunciar
          </MenuItem>
        </DropdownMenu>
      </header>

      {/* Imagens */}
      {post.images.length > 0 ? (
        <div className="relative bg-ink-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.images[imageIndex]?.url}
            alt={post.images[imageIndex]?.alt ?? ''}
            className="max-h-[32rem] w-full object-cover"
            loading="lazy"
          />

          {post.images.length > 1 ? (
            <>
              <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
                {post.images.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setImageIndex(index)}
                    aria-label={`Ver foto ${index + 1} de ${post.images.length}`}
                    aria-current={index === imageIndex}
                    className={cn(
                      'h-2 rounded-full transition-all',
                      index === imageIndex
                        ? 'w-5 bg-white'
                        : 'w-2 bg-white/60 hover:bg-white/85',
                    )}
                  />
                ))}
              </div>

              {imageIndex > 0 ? (
                <button
                  type="button"
                  onClick={() => setImageIndex((index) => index - 1)}
                  aria-label="Foto anterior"
                  className="absolute top-1/2 left-2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-ink-700 backdrop-blur-sm hover:bg-white"
                >
                  <Icon name="chevronLeft" size={18} />
                </button>
              ) : null}

              {imageIndex < post.images.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setImageIndex((index) => index + 1)}
                  aria-label="Próxima foto"
                  className="absolute top-1/2 right-2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-ink-700 backdrop-blur-sm hover:bg-white"
                >
                  <Icon name="chevronRight" size={18} />
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}

      {/* Corpo */}
      <div className="p-3.5">
        <p className="leading-relaxed whitespace-pre-line text-ink-800">
          {post.caption}
        </p>

        {post.plant ? (
          <Link
            href={`/plantas/${post.plant.slug}`}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-sm text-brand-800 hover:bg-brand-100"
          >
            <Icon name="leaf" size={14} />
            {post.plant.label}
          </Link>
        ) : null}

        {post.tags.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <li key={tag}>
                <Link
                  href={`/comunidade?tag=${tag}`}
                  className="text-sm text-brand-700 hover:underline"
                >
                  #{tag}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        {/* Ações */}
        <div className="mt-3.5 flex items-center gap-1 border-t border-ink-100 pt-3">
          <button
            type="button"
            onClick={handleLike}
            aria-pressed={liked}
            disabled={pending}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
              liked ? 'text-brand-700' : 'text-ink-600 hover:bg-ink-50',
            )}
          >
            <Icon
              name="heart"
              size={19}
              className={cn(liked && 'animate-pop fill-current')}
            />
            {likeCount > 0 ? likeCount : ''}
            <span className="sr-only">
              {liked ? 'Remover o gostei' : 'Gostei'}
            </span>
          </button>

          {allowComments ? (
            <button
              type="button"
              onClick={() => setShowComments((value) => !value)}
              aria-expanded={showComments}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              <Icon name="message" size={19} />
              {post.commentCount > 0 ? post.commentCount : ''}
              <span className="sr-only">Comentários</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-2 text-sm text-ink-400">
              <Icon name="messageOff" size={18} />
              Comentários desativados pelo autor.
            </span>
          )}

          <button
            type="button"
            onClick={handleSave}
            aria-pressed={saved}
            disabled={pending}
            className={cn(
              'ml-auto inline-flex items-center rounded-md px-2.5 py-2 transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
              saved ? 'text-brand-700' : 'text-ink-600 hover:bg-ink-50',
            )}
          >
            <Icon name="bookmark" size={19} className={cn(saved && 'fill-current')} />
            <span className="sr-only">{saved ? 'Remover dos salvos' : 'Salvar'}</span>
          </button>
        </div>

        {/* Comentários */}
        {showComments && allowComments ? (
          <div className="mt-3 border-t border-ink-100 pt-3.5">
            {comments && comments.length > 0 ? (
              <ul className="space-y-3">
                {comments.map((comment) => (
                  <li key={comment.id} className="flex gap-2.5">
                    <Avatar
                      name={comment.author.displayName}
                      src={comment.author.avatarUrl}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1 rounded-lg bg-ink-50 px-3 py-2">
                      <p className="text-sm">
                        <Link
                          href={
                            comment.author.username
                              ? `/perfil/${comment.author.username}`
                              : '#'
                          }
                          className="font-medium text-ink-900 hover:text-brand-700"
                        >
                          {comment.author.displayName}
                        </Link>
                        <span className="ml-2 text-xs text-ink-500">
                          {formatRelative(comment.createdAt)}
                        </span>
                      </p>
                      <p className="mt-0.5 text-sm leading-relaxed text-ink-700">
                        {comment.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-500">
                Ainda não há comentários. Seja a primeira pessoa a responder.
              </p>
            )}

            {isAuthenticated ? (
              <form action={commentAction} className="mt-3.5 flex gap-2.5">
                <input type="hidden" name="postId" value={post.id} />
                <label htmlFor={`comentario-${post.id}`} className="sr-only">
                  Escrever comentário
                </label>
                <Textarea
                  id={`comentario-${post.id}`}
                  name="body"
                  rows={1}
                  maxLength={1000}
                  required
                  placeholder="Escreva um comentário"
                  className="min-h-11"
                />
                <SubmitButton size="sm" iconLeft="arrowRight">
                  <span className="sr-only">Enviar</span>
                </SubmitButton>
              </form>
            ) : (
              <p className="mt-3 text-sm text-ink-500">
                <Link href="/entrar" className="text-brand-700 hover:underline">
                  Entre
                </Link>{' '}
                para comentar.
              </p>
            )}
          </div>
        ) : null}
      </div>

      {/* Denúncia */}
      <Modal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Denunciar publicação"
        description="A equipe de moderação avalia todas as denúncias."
        size="sm"
        footer={
          <div className="flex gap-2.5">
            <Button variant="outline" fullWidth onClick={() => setReportOpen(false)}>
              Cancelar
            </Button>
            <Button variant="danger" fullWidth loading={pending} onClick={submitReport}>
              Enviar denúncia
            </Button>
          </div>
        }
      >
        <fieldset>
          <legend className="text-sm font-medium text-ink-800">
            Qual é o motivo?
          </legend>
          <div className="mt-3 space-y-1">
            {REPORT_REASONS.map((reason) => (
              <label
                key={reason.value}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 hover:bg-ink-50"
              >
                <input
                  type="radio"
                  name="reason"
                  value={reason.value}
                  checked={reportReason === reason.value}
                  onChange={() => setReportReason(reason.value)}
                  className="h-4 w-4 accent-brand-600"
                />
                <span className="text-sm text-ink-800">{reason.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </Modal>
    </article>
  );
}
