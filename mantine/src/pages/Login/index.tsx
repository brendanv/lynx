import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePocketBase } from "@/hooks/usePocketBase";
import {
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Text,
  Alert,
} from "@mantine/core";
import classes from "./Login.module.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { pb } = usePocketBase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await pb.collection("users").authWithPassword(username, password, {
        autoRefreshThreshold: 30 * 60,
      });
      navigate("/");
    } catch (error) {
      console.error("Login failed:", error);
      setError("Login failed. Please check your credentials and try again.");
    }
  };

  return (
    <div className={classes.wrapper}>
      <Paper className={classes.form} radius={0} p={30}>
        <Title order={2} className={classes.title} ta="center" mt="md" mb={50}>
          Welcome back to Lynx!
        </Title>

        <form onSubmit={handleSubmit}>
          {error && (
            <Alert color="red" title="Login Failed" mb="md">
              {error}
            </Alert>
          )}

          <TextInput
            label="Username"
            placeholder="lynx"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <PasswordInput
            label="Password"
            placeholder="Your password"
            mt="md"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" fullWidth mt="xl">
            Login
          </Button>
        </form>

        <Text ta="center" mt="md">
          Don&apos;t have an account? Contact your administrator.
        </Text>
      </Paper>
    </div>
  );
};

export default Login;