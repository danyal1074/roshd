import os
import paramiko

HOST = "89.46.217.44"
PORT = 22
USER = "root"
PASSWORD = "c6khenbR98FpxqnM"

def upload_dir(local_dir, remote_dir):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=15)
    sftp = client.open_sftp()

    def mkdir_p(remote_path):
        dirs = []
        p = remote_path
        while p and p != '/':
            dirs.append(p)
            p = os.path.dirname(p)
        for d in reversed(dirs):
            try:
                sftp.stat(d)
            except IOError:
                sftp.mkdir(d)

    mkdir_p(remote_dir)

    for root, dirs, files in os.walk(local_dir):
        rel_path = os.path.relpath(root, local_dir)
        target_dir = os.path.normpath(os.path.join(remote_dir, rel_path)).replace('\\', '/')
        mkdir_p(target_dir)

        for file in files:
            local_file = os.path.join(root, file)
            remote_file = os.path.normpath(os.path.join(target_dir, file)).replace('\\', '/')
            print(f"Uploading {local_file} -> {remote_file}")
            sftp.put(local_file, remote_file)

    sftp.close()
    client.close()
    print("Upload complete!")

if __name__ == '__main__':
    upload_dir('frontend/dist', '/var/www/roshd/frontend/dist')
