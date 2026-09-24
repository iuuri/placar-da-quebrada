import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { CheckboxField } from '@/components/ui/checkbox-field'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { Campeonato } from '@/types/database.types'
import {
  campeonatoSchema,
  gerarSlug,
  MODALIDADES,
  STATUS_CAMPEONATO,
  type CampeonatoFormInput,
  type CampeonatoFormValues,
} from '../schemas'

type Props = {
  campeonato?: Campeonato
  salvando: boolean
  erro: string | null
  rotuloSalvar: string
  onSalvar: (valores: CampeonatoFormValues) => void
}

function valoresIniciais(c?: Campeonato): CampeonatoFormInput {
  return {
    nome: c?.nome ?? '',
    slug: c?.slug ?? '',
    temporada: c?.temporada ?? String(new Date().getFullYear()),
    modalidade: c?.modalidade ?? 'society',
    local_padrao: c?.local_padrao ?? '',
    status: c?.status ?? 'rascunho',
    publico: c?.publico ?? false,
    pontos_vitoria: c?.pontos_vitoria ?? 3,
    pontos_empate: c?.pontos_empate ?? 1,
    pontos_derrota: c?.pontos_derrota ?? 0,
    qtd_periodos: c?.qtd_periodos ?? 2,
    minutos_periodo: c?.minutos_periodo ?? 25,
  }
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4 border-t-2 border-tinta pt-4">
      <legend className="pr-2 font-display text-2xl font-bold">{titulo}</legend>
      {children}
    </fieldset>
  )
}

export function CampeonatoForm({ campeonato, salvando, erro, rotuloSalvar, onSalvar }: Props) {
  // Na criação, o endereço acompanha o nome até a pessoa editar o endereço à mão.
  const [slugManual, setSlugManual] = useState(Boolean(campeonato))
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<CampeonatoFormInput, unknown, CampeonatoFormValues>({
    resolver: zodResolver(campeonatoSchema),
    defaultValues: valoresIniciais(campeonato),
  })

  const slug = useWatch({ control, name: 'slug' })
  const erroDe = (campo: keyof CampeonatoFormInput) => errors[campo]?.message
  const aria = (campo: keyof CampeonatoFormInput) => ({
    'aria-invalid': Boolean(errors[campo]),
    'aria-describedby': errors[campo] ? `${campo}-erro` : undefined,
  })

  const nomeRegistro = register('nome', {
    onChange: (e) => {
      if (!slugManual) setValue('slug', gerarSlug(e.target.value), { shouldValidate: Boolean(errors.slug) })
    },
  })
  const slugRegistro = register('slug', { onChange: () => setSlugManual(true) })

  return (
    <form onSubmit={handleSubmit(onSalvar)} noValidate className="flex max-w-2xl flex-col gap-8">
      {erro ? <Alert>{erro}</Alert> : null}

      <Secao titulo="Dados">
        <Field id="nome" label="Nome do campeonato" error={erroDe('nome')}>
          <Input id="nome" placeholder="Copa da Vila" {...aria('nome')} {...nomeRegistro} />
        </Field>
        <Field id="slug" label="Endereço no site" error={erroDe('slug')}>
          <Input id="slug" autoCapitalize="none" spellCheck={false} {...aria('slug')} {...slugRegistro} />
          <p className="text-sm text-tinta-suave">
            placar-da-quebrada.pages.dev/c/<strong className="text-tinta">{slug || '…'}</strong>
          </p>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="temporada" label="Temporada" error={erroDe('temporada')}>
            <Input id="temporada" inputMode="numeric" {...aria('temporada')} {...register('temporada')} />
          </Field>
          <Field id="modalidade" label="Modalidade" error={erroDe('modalidade')}>
            <Select id="modalidade" {...register('modalidade')}>
              {MODALIDADES.map((m) => (
                <option key={m.valor} value={m.valor}>
                  {m.rotulo}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field id="local_padrao" label="Local dos jogos (opcional)" error={erroDe('local_padrao')}>
          <Input id="local_padrao" placeholder="Campo do Jardim" {...aria('local_padrao')} {...register('local_padrao')} />
        </Field>
      </Secao>

      <Secao titulo="Regras">
        <div className="grid grid-cols-3 gap-3">
          <Field id="pontos_vitoria" label="Vitória" error={erroDe('pontos_vitoria')}>
            <Input id="pontos_vitoria" type="number" inputMode="numeric" min={0} max={10} {...aria('pontos_vitoria')} {...register('pontos_vitoria')} />
          </Field>
          <Field id="pontos_empate" label="Empate" error={erroDe('pontos_empate')}>
            <Input id="pontos_empate" type="number" inputMode="numeric" min={0} max={10} {...aria('pontos_empate')} {...register('pontos_empate')} />
          </Field>
          <Field id="pontos_derrota" label="Derrota" error={erroDe('pontos_derrota')}>
            <Input id="pontos_derrota" type="number" inputMode="numeric" min={0} max={10} {...aria('pontos_derrota')} {...register('pontos_derrota')} />
          </Field>
        </div>
        <p className="-mt-2 text-sm text-tinta-suave">Pontos que cada resultado vale na tabela.</p>
        <div className="grid grid-cols-2 gap-3">
          <Field id="qtd_periodos" label="Tempos por jogo" error={erroDe('qtd_periodos')}>
            <Input id="qtd_periodos" type="number" inputMode="numeric" min={1} max={4} {...aria('qtd_periodos')} {...register('qtd_periodos')} />
          </Field>
          <Field id="minutos_periodo" label="Minutos por tempo" error={erroDe('minutos_periodo')}>
            <Input id="minutos_periodo" type="number" inputMode="numeric" min={1} max={90} {...aria('minutos_periodo')} {...register('minutos_periodo')} />
          </Field>
        </div>
      </Secao>

      <Secao titulo="Publicação">
        <Field id="status" label="Situação" error={erroDe('status')}>
          <Select id="status" {...register('status')}>
            {STATUS_CAMPEONATO.map((s) => (
              <option key={s.valor} value={s.valor}>
                {s.rotulo}
              </option>
            ))}
          </Select>
        </Field>
        <CheckboxField
          id="publico"
          label="Mostrar para a torcida"
          descricao="Quando marcado, qualquer pessoa vê o campeonato no site, sem login."
          {...register('publico')}
        />
      </Secao>

      <Button type="submit" size="lg" disabled={salvando} className="sm:self-start">
        {salvando ? 'Salvando…' : rotuloSalvar}
      </Button>
    </form>
  )
}
