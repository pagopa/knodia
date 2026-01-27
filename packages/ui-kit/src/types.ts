export type PolymorphicProps<
  E extends React.ElementType,
  V = object,
> = React.ComponentPropsWithRef<E> &
  V & {
    as?: E;
  };
