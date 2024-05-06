def append_text_to_file(file_path, reps):
    try: 
        with open(file_path, 'a') as file:
            file.write("const variable1 = 1;\n")
            file.write("const variable2 = 2;\n\n")
            for _ in range(reps):
                file.write("function generatedFunction" + str(_) + "(parameter: number): number {\n")
                file.write("   let str: string = 'test';\n\n")
                file.write("   console.log(str);\n\n")
                file.write("   return parameter * 2;\n}\n\n")
        print(f"Text added to '{file_path}' successfully.")
    except FileNotFoundError:
        print(f"Error: File '{file_path}' not found.")

append_text_to_file("./test-file-1mb.ts", 7000) # 1mb
append_text_to_file("./test-file-10mb.ts", 70000) # 10mb
append_text_to_file("./test-file-100mb.ts", 700000) # 100mb
append_text_to_file("./test-file-1gb.ts", 7250000) # 1gb
