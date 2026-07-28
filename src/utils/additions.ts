import { AdditionCategoryGroup, Product, ProductAddition, SelectedAddition } from '../types';

export type AdditionQtyMap = Map<string, number>;

function normalizeAdditionItem(addition: ProductAddition): ProductAddition {
  return {
    ...addition,
    price: Number(addition.price) || 0,
    min_quantity: Number(addition.min_quantity ?? 0),
    max_quantity: Number(addition.max_quantity ?? 99),
    category_min_selections: Number(addition.category_min_selections ?? 0),
    category_max_selections: Number(addition.category_max_selections ?? 99),
    category_required: Boolean(addition.category_required),
    category_sort_order: Number(addition.category_sort_order ?? 0),
  };
}

function normalizeAdditionGroup(group: AdditionCategoryGroup): AdditionCategoryGroup {
  return {
    ...group,
    min_selections: Number(group.min_selections ?? 0),
    max_selections: Number(group.max_selections ?? 99),
    required: Boolean(group.required) || (group.min_selections ?? 0) > 0,
    sort_order: Number(group.sort_order ?? 0),
    additions: (group.additions ?? []).map(normalizeAdditionItem),
  };
}

function dedupeAdditionsById(additions: ProductAddition[]): ProductAddition[] {
  const byId = new Map<string, ProductAddition>();
  for (const raw of additions) {
    if (!raw?.id) continue;
    const key = String(raw.id).trim().toLowerCase();
    if (!byId.has(key)) {
      byId.set(key, normalizeAdditionItem(raw));
    }
  }
  return [...byId.values()];
}

function applyUncategorizedProductRules(
  groups: AdditionCategoryGroup[],
  product: Pick<
    Product,
    | 'uncategorized_additions_min_selections'
    | 'uncategorized_additions_max_selections'
    | 'uncategorized_additions_required'
  >
): AdditionCategoryGroup[] {
  return groups.map((group) => {
    if (group.id != null) return group;
    const min = Number(product.uncategorized_additions_min_selections ?? group.min_selections ?? 0);
    const max = Number(product.uncategorized_additions_max_selections ?? group.max_selections ?? 99);
    const required = Boolean(product.uncategorized_additions_required) || min > 0;
    return {
      ...group,
      name: group.name || 'Outros adicionais',
      min_selections: min,
      max_selections: max,
      required,
    };
  });
}

export function normalizeProductAdditions(product: Product): Product {
  const additions = dedupeAdditionsById(parseAdditions(product.additions));
  let addition_categories = parseAdditionCategories(product.addition_categories)
    .map(normalizeAdditionGroup)
    .filter((group) => (group.additions?.length ?? 0) > 0);

  // Paridade com o web: só reconstrói grupos quando a API não enviou categorias.
  if (addition_categories.length === 0 && additions.length > 0) {
    addition_categories = buildAdditionCategoriesFromAdditions(additions);
  }

  addition_categories = applyUncategorizedProductRules(addition_categories, product);
  addition_categories = sortAdditionGroupsByPriority(addition_categories);

  return { ...product, additions, addition_categories };
}

function parseAdditions(raw: unknown): ProductAddition[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function parseAdditionCategories(raw: unknown): AdditionCategoryGroup[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function buildAdditionCategoriesFromAdditions(additions: ProductAddition[]): AdditionCategoryGroup[] {
  const groups = new Map<string, AdditionCategoryGroup>();
  const uncategorized: ProductAddition[] = [];

  for (const raw of additions) {
    const addition = normalizeAdditionItem(raw);
    if (!addition.category_id) {
      uncategorized.push(addition);
      continue;
    }
    if (!groups.has(addition.category_id)) {
      groups.set(addition.category_id, {
        id: addition.category_id,
        name: addition.category_name || 'Grupo',
        min_selections: addition.category_min_selections ?? 0,
        max_selections: addition.category_max_selections ?? 99,
        required: Boolean(addition.category_required) || (addition.category_min_selections ?? 0) > 0,
        sort_order: Number(addition.category_sort_order ?? 0),
        additions: [],
      });
    }
    groups.get(addition.category_id)!.additions.push(addition);
  }

  const result = sortAdditionGroupsByPriority([...groups.values()]);
  if (uncategorized.length > 0) {
    result.push({
      id: null,
      name: 'Outros adicionais',
      min_selections: 0,
      max_selections: 99,
      required: false,
      sort_order: 9999,
      additions: uncategorized,
    });
  }
  return result.filter((group) => group.additions.length > 0);
}

export function isAdditionGroupRequired(group: Pick<AdditionCategoryGroup, 'required' | 'min_selections'>): boolean {
  return Boolean(group.required) || (group.min_selections ?? 0) > 0;
}

export function sortAdditionGroupsByPriority(groups: AdditionCategoryGroup[]): AdditionCategoryGroup[] {
  return [...groups].sort((a, b) => {
    const aRequired = isAdditionGroupRequired(a);
    const bRequired = isAdditionGroupRequired(b);
    if (aRequired !== bRequired) return aRequired ? -1 : 1;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name);
  });
}

export function productAdditionGroups(product: Pick<Product, 'additions' | 'addition_categories'>): AdditionCategoryGroup[] {
  return normalizeProductAdditions(product as Product).addition_categories ?? [];
}

export function groupMinimumSelections(group: Pick<AdditionCategoryGroup, 'min_selections' | 'required'>): number {
  const min = group.min_selections ?? 0;
  if (min > 0) return min;
  if (group.required) return 1;
  return 0;
}

export function categoryHint(group: Pick<AdditionCategoryGroup, 'min_selections' | 'max_selections' | 'required'>): string {
  const max = group.max_selections ?? 99;
  const required = group.required || (group.min_selections ?? 0) > 0;
  const neededMin = groupMinimumSelections(group);

  if (required && neededMin === max && max === 1) {
    return 'Escolha 1 opção';
  }
  if (required && neededMin === max) {
    return `Escolha ${neededMin} opções`;
  }
  if (required && neededMin > 0 && max > neededMin) {
    return `Escolha de ${neededMin} a ${max}`;
  }
  if (max === 1) {
    return required ? 'Escolha 1 opção' : 'Escolha até 1 opção';
  }
  if (max < 99) {
    return neededMin > 0 ? `Escolha de ${neededMin} a ${max}` : `Escolha até ${max}`;
  }
  if (required) return 'Obrigatório';
  return 'Opcional';
}

export function additionQty(qtyMap: AdditionQtyMap, id: string): number {
  return qtyMap.get(id) ?? 0;
}

/** Soma das unidades no grupo (limite "Escolha até N"). */
export function categorySelectionCount(group: AdditionCategoryGroup, qtyMap: AdditionQtyMap): number {
  return group.additions.reduce((total, add) => total + additionQty(qtyMap, add.id), 0);
}

export function canIncreaseAddition(
  add: ProductAddition,
  group: AdditionCategoryGroup,
  qtyMap: AdditionQtyMap
): boolean {
  const current = additionQty(qtyMap, add.id);
  const maxItem = add.max_quantity ?? 99;
  if (current >= maxItem) return false;

  const maxGroup = group.max_selections ?? 99;
  const total = categorySelectionCount(group, qtyMap);

  if (total >= maxGroup) {
    // max=1: permite trocar para outra opção
    return maxGroup === 1 && current === 0;
  }

  return true;
}

export function changeAdditionQty(
  add: ProductAddition,
  group: AdditionCategoryGroup,
  qtyMap: AdditionQtyMap,
  delta: number
): AdditionQtyMap {
  const current = additionQty(qtyMap, add.id);
  const maxItem = add.max_quantity ?? 99;
  const maxGroup = group.max_selections ?? 99;
  let next = current + delta;
  if (next < 0) next = 0;
  if (next > maxItem) next = maxItem;

  const nextMap = new Map(qtyMap);

  if (delta > 0 && next > 0 && maxGroup === 1) {
    for (const other of group.additions) {
      if (other.id !== add.id) nextMap.delete(other.id);
    }
  }

  if (delta > 0 && next > current) {
    const othersTotal = categorySelectionCount(group, nextMap) - current;
    const room = maxGroup - othersTotal;
    if (room <= 0 && !(maxGroup === 1 && current === 0)) {
      return qtyMap;
    }
    if (next > room) next = Math.max(current, room);
  }

  if (next === 0) {
    nextMap.delete(add.id);
  } else {
    nextMap.set(add.id, next);
  }
  return nextMap;
}

export function validateAdditionSelections(
  product: Pick<Product, 'additions' | 'addition_categories'>,
  qtyMap: AdditionQtyMap
): string | null {
  for (const group of productAdditionGroups(product)) {
    const selectedCount = categorySelectionCount(group, qtyMap);
    const max = group.max_selections ?? 99;
    const neededMin = groupMinimumSelections(group);
    if (selectedCount < neededMin) {
      return neededMin === 1
        ? `Selecione pelo menos 1 em "${group.name}"`
        : `Selecione pelo menos ${neededMin} em "${group.name}"`;
    }
    if (selectedCount > max) {
      return `Máximo de ${max} em "${group.name}"`;
    }
  }

  for (const add of product.additions ?? []) {
    const qty = additionQty(qtyMap, add.id);
    const min = add.min_quantity ?? 0;
    const max = add.max_quantity ?? 99;
    if (qty > 0 && qty < min) {
      return `Mínimo de ${min} unidade(s) para "${add.name}"`;
    }
    if (qty > max) {
      return `Máximo de ${max} unidade(s) para "${add.name}"`;
    }
  }

  return null;
}

export function selectedAdditionsPayload(qtyMap: AdditionQtyMap): SelectedAddition[] {
  return [...qtyMap.entries()]
    .filter(([, qty]) => qty > 0)
    .map(([id, quantity]) => ({ id, quantity }));
}
