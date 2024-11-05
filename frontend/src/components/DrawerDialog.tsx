import { useMediaQuery } from "@mantine/hooks";
import { Drawer, Text, Modal } from "@mantine/core";

interface Props {
  children: React.ReactNode;
  title: string;
  open: boolean;
  onClose: () => void;
}

const DrawerDialog = ({ children, title, open, onClose }: Props) => {
  const isLargeScreen = useMediaQuery("(min-width: 45em)");

  if (!isLargeScreen) {
    return (
      <Drawer
        title={
          <Text size="lg" fw={700}>
            {title}
          </Text>
        }
        overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
        position="bottom"
        opened={open}
        onClose={onClose}
      >
        {children}
      </Drawer>
    );
  } else {
    return (
      <Modal
        title={
          <Text size="lg" fw={700}>
            {title}
          </Text>
        }
        overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
        opened={open}
        onClose={onClose}
      >
        {children}
      </Modal>
    );
  }
};

export default DrawerDialog;
