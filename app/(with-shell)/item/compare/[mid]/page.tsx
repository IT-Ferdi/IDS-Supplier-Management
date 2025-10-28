import ItemCompare from '@/components/item/item-compare';

export default function ComparePage({ params }: { params: { mid: string } }) {
    return <ItemCompare mid={params.mid} />;
}
