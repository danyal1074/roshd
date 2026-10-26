import sys
import paramiko

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

HOST = "89.46.217.44"
PORT = 22
USER = "root"
PASSWORD = "c6khenbR98FpxqnM"

def run_remote(cmd):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=15)
        stdin, stdout, stderr = client.exec_command(cmd)
        out = stdout.read().decode('utf-8', errors='replace')
        err = stderr.read().decode('utf-8', errors='replace')
        return out, err
    finally:
        client.close()

if __name__ == '__main__':
    command = sys.argv[1] if len(sys.argv) > 1 else 'pm2 status'
    out, err = run_remote(command)
    if out:
        print(out)
    if err:
        print("STDERR:", err, file=sys.stderr)
