import json

def get_model_stream(client, contents, models_list=None):
    if models_list is None:
        models_list = [
            "gemini-3.1-flash-lite-preview",
            "gemini-3-flash-preview",
            "gemini-2.5-flash-lite",
            "gemini-2.5-flash"
        ]

    for model_name in models_list:
        try:
            print(f"--- Attempting generation with: {model_name}")
            response_stream = client.models.generate_content_stream(
                model=model_name,
                contents=contents
            )
                        
            def stream_wrapper(stream):
                for chunk in stream:
                    yield chunk

            iterable_stream = stream_wrapper(response_stream)
            first_chunk = next(iterable_stream)

            def final_generator(first, rest):
                yield first
                for item in rest:
                    yield item

            return final_generator(first_chunk, iterable_stream), model_name

        except Exception as e:
            print(f"--- Model {model_name} failed: {e}")
            continue
    
    return None, None
